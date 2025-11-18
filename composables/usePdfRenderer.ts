import { ref, shallowRef, markRaw, onBeforeUnmount, readonly } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { logger } from '~/utils/logger'
import { handleError } from '~/utils/errorHandler'

// Maximum number of PDFs to cache (LRU eviction)
const MAX_CACHE_SIZE = 10
// Maximum number of rendered bitmaps to cache per PDF (zoom levels)
const MAX_BITMAPS_PER_PDF = 3
// Maximum canvas dimensions to prevent memory issues with very large PDFs
const MAX_CANVAS_DIMENSION = 4096 // 4096x4096 is ~64MB for RGBA
const MAX_CANVAS_PIXELS = 16 * 1024 * 1024 // 16 megapixels

// Bitmap cache entry structure
interface BitmapCacheEntry {
  bitmap: ImageBitmap
  scale: number
  width: number
  height: number
  timestamp: number
}

export const usePdfRenderer = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache for loaded PDF documents to avoid reloading on zoom change
  // Use shallowRef to avoid deep reactivity on PDF.js objects
  const pdfCache = shallowRef<Map<string, { pdf: PDFDocumentProxy; page: PDFPageProxy }>>(new Map())

  // Track access order for LRU eviction (most recently used = end of array)
  const cacheAccessOrder = ref<string[]>([])

  // Cache for rendered bitmaps to avoid re-rendering at same zoom
  // Key: PDF cache key, Value: array of bitmap entries (LRU sorted)
  const bitmapCache = shallowRef<Map<string, BitmapCacheEntry[]>>(new Map())

  // Track current render task for cancellation
  let currentRenderTask: RenderTask | null = null

  /**
   * Rounds scale to zoom buckets (25% increments) to increase cache hits
   */
  const roundToZoomBucket = (scale: number): number => {
    return Math.round(scale * 4) / 4 // Round to nearest 0.25
  }

  /**
   * Caps canvas dimensions to prevent memory issues
   * Returns scaled dimensions if needed and whether capping occurred
   */
  const capCanvasDimensions = (
    width: number,
    height: number
  ): { width: number; height: number; wasCapped: boolean } => {
    let newWidth = width
    let newHeight = height
    let wasCapped = false

    // Check if either dimension exceeds maximum
    if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
      const aspectRatio = width / height
      if (width > height) {
        newWidth = MAX_CANVAS_DIMENSION
        newHeight = MAX_CANVAS_DIMENSION / aspectRatio
      } else {
        newHeight = MAX_CANVAS_DIMENSION
        newWidth = MAX_CANVAS_DIMENSION * aspectRatio
      }
      wasCapped = true
      logger.warn(
        `Canvas dimensions capped: ${Math.round(width)}x${Math.round(height)} → ${Math.round(newWidth)}x${Math.round(newHeight)}`
      )
    }

    // Check if total pixels exceed maximum
    const totalPixels = newWidth * newHeight
    if (totalPixels > MAX_CANVAS_PIXELS) {
      const scaleFactor = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels)
      newWidth = newWidth * scaleFactor
      newHeight = newHeight * scaleFactor
      wasCapped = true
      logger.warn(
        `Canvas pixel count capped: ${Math.round(width * height).toLocaleString()} → ${Math.round(newWidth * newHeight).toLocaleString()} pixels`
      )
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
      wasCapped,
    }
  }

  /**
   * Finds a cached bitmap for a given PDF and scale
   */
  const findCachedBitmap = (key: string, scale: number): BitmapCacheEntry | null => {
    const bucketScale = roundToZoomBucket(scale)
    const entries = bitmapCache.value.get(key)
    if (!entries) return null

    return entries.find((entry) => entry.scale === bucketScale) || null
  }

  /**
   * Adds a bitmap to the cache with LRU eviction
   */
  const cacheBitmap = async (
    key: string,
    bitmap: ImageBitmap,
    scale: number,
    width: number,
    height: number
  ) => {
    const bucketScale = roundToZoomBucket(scale)
    const entry: BitmapCacheEntry = {
      bitmap,
      scale: bucketScale,
      width,
      height,
      timestamp: Date.now(),
    }

    let entries = bitmapCache.value.get(key)
    if (!entries) {
      entries = []
      bitmapCache.value.set(key, entries)
    }

    // Remove existing entry for this scale if present
    const existingIndex = entries.findIndex((e) => e.scale === bucketScale)
    if (existingIndex !== -1) {
      entries[existingIndex].bitmap.close()
      entries.splice(existingIndex, 1)
    }

    // Add new entry
    entries.push(entry)

    // Sort by timestamp (most recent last)
    entries.sort((a, b) => a.timestamp - b.timestamp)

    // Evict oldest if over limit
    while (entries.length > MAX_BITMAPS_PER_PDF) {
      const oldest = entries.shift()
      if (oldest) {
        oldest.bitmap.close()
      }
    }
  }

  /**
   * Evicts a PDF from cache and properly destroys it to free memory
   */
  const evictPdf = (key: string) => {
    const cached = pdfCache.value.get(key)
    if (cached?.pdf) {
      try {
        // Destroy the PDF.js document to free resources
        cached.pdf.destroy()
      } catch (err) {
        logger.warn('Error destroying PDF:', err)
      }
    }
    pdfCache.value.delete(key)

    // Clear bitmap cache for this PDF
    const bitmaps = bitmapCache.value.get(key)
    if (bitmaps) {
      bitmaps.forEach((entry) => entry.bitmap.close())
      bitmapCache.value.delete(key)
    }

    // Remove from access order tracking
    const index = cacheAccessOrder.value.indexOf(key)
    if (index !== -1) {
      cacheAccessOrder.value.splice(index, 1)
    }
  }

  /**
   * Updates cache access order for LRU tracking
   */
  const touchCacheEntry = (key: string) => {
    // Remove from current position
    const index = cacheAccessOrder.value.indexOf(key)
    if (index !== -1) {
      cacheAccessOrder.value.splice(index, 1)
    }
    // Add to end (most recently used)
    cacheAccessOrder.value.push(key)
  }

  /**
   * Renders the first page of a PDF file to a canvas element
   * @param file - The PDF file to render
   * @param canvas - The canvas element to render to
   * @param scale - Scale factor for rendering (default: 1.5)
   */
  const renderPdfToCanvas = async (
    file: File,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ): Promise<void> => {
    // Cancel any in-progress render
    if (currentRenderTask) {
      logger.log('Cancelling previous render task')
      try {
        await currentRenderTask.cancel()
      } catch {
        // Cancellation errors are expected, ignore them
      }
      currentRenderTask = null
    }

    isLoading.value = true
    error.value = null

    try {
      logger.log('Starting PDF render for:', file.name, 'at scale:', scale)

      let pdf, page
      const cacheKey = file.name + file.size + file.lastModified

      // Check bitmap cache first (fastest path - 5-20× faster than PDF.js render)
      const cachedBitmap = findCachedBitmap(cacheKey, scale)
      if (cachedBitmap) {
        logger.log('Bitmap cache HIT for scale:', scale, '(bucket:', cachedBitmap.scale, ')')

        // Set canvas dimensions to match cached bitmap
        canvas.width = cachedBitmap.width
        canvas.height = cachedBitmap.height

        // Get canvas context
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Failed to get canvas 2d context')
        }

        // Draw cached bitmap to canvas (very fast)
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(cachedBitmap.bitmap, 0, 0)

        logger.log('Bitmap drawn from cache (fast path)')
        isLoading.value = false
        return // Early return - no PDF.js rendering needed
      }

      logger.log('Bitmap cache MISS - will render via PDF.js and cache result')

      // Check if PDF is already loaded in cache
      if (pdfCache.value.has(cacheKey)) {
        logger.log('Using cached PDF document')
        const cached = pdfCache.value.get(cacheKey)!
        pdf = cached.pdf
        page = cached.page

        // Update LRU tracking
        touchCacheEntry(cacheKey)
      } else {
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        logger.log('ArrayBuffer created, size:', arrayBuffer.byteLength)

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        pdf = await loadingTask.promise
        logger.log('PDF loaded, pages:', pdf.numPages)

        // Get the first page
        page = await pdf.getPage(1)
        logger.log('Page 1 loaded')

        // Check if cache is full and evict LRU entry
        if (pdfCache.value.size >= MAX_CACHE_SIZE && cacheAccessOrder.value.length > 0) {
          const lruKey = cacheAccessOrder.value[0] // Least recently used is at start
          logger.log('Cache full, evicting LRU PDF:', lruKey)
          evictPdf(lruKey)
        }

        // Cache the PDF and page with markRaw to prevent Vue reactivity issues
        pdfCache.value.set(cacheKey, { pdf: markRaw(pdf), page: markRaw(page) })

        // Track in LRU order
        touchCacheEntry(cacheKey)
      }

      // Calculate viewport with the specified scale
      const viewport = page.getViewport({ scale })
      logger.log('Viewport:', viewport.width, 'x', viewport.height)

      // Cap canvas dimensions to prevent memory issues
      const {
        width: cappedWidth,
        height: cappedHeight,
        wasCapped,
      } = capCanvasDimensions(viewport.width, viewport.height)

      if (wasCapped) {
        logger.warn(
          'Large PDF detected - canvas size has been reduced to prevent browser memory issues. Some quality may be lost.'
        )
      }

      // Set canvas dimensions (capped if necessary)
      canvas.width = cappedWidth
      canvas.height = cappedHeight

      // Get canvas context
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas 2d context')
      }

      // Clear canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height)

      // If dimensions were capped, we need to use a scaled viewport
      const renderViewport = wasCapped
        ? page.getViewport({
            scale: scale * (cappedWidth / viewport.width),
          })
        : viewport

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: renderViewport,
      }

      // Start rendering and track the task
      currentRenderTask = page.render(renderContext)

      await currentRenderTask.promise
      logger.log('PDF rendered successfully')
      currentRenderTask = null

      // Create ImageBitmap from canvas and cache it for future use
      try {
        const bitmap = await createImageBitmap(canvas)
        await cacheBitmap(cacheKey, bitmap, scale, canvas.width, canvas.height)
        logger.log('Bitmap cached for scale:', scale, '(bucket:', roundToZoomBucket(scale), ')')
      } catch (bitmapErr) {
        // Non-fatal: caching failed but render succeeded
        logger.warn('Failed to cache bitmap:', bitmapErr)
      }
    } catch (err) {
      // Check if it was a cancellation
      if (err instanceof Error && err.name === 'RenderingCancelledException') {
        logger.log('Render was cancelled')
        return // Don't treat cancellation as an error
      }

      // Use structured error handling
      const appError = handleError(err as Error, {
        file: file.name,
        fileSize: file.size,
        scale,
        canvasDimensions: `${canvas.width}x${canvas.height}`,
      })

      error.value = appError.userMessage
      logger.error('PDF rendering error:', appError)
      throw appError
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gets the dimensions of the first page of a PDF
   * @param file - The PDF file
   * @param scale - Scale factor for dimensions (default: 1.5)
   * @returns Object with width and height
   */
  const getPdfDimensions = async (
    file: File,
    scale: number = 1.5
  ): Promise<{ width: number; height: number }> => {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale })

    return {
      width: viewport.width,
      height: viewport.height,
    }
  }

  /**
   * Clears the PDF cache and properly destroys all PDFs to free memory
   */
  const clearCache = () => {
    // Destroy all cached PDFs before clearing
    for (const [_key, cached] of pdfCache.value.entries()) {
      if (cached?.pdf) {
        try {
          cached.pdf.destroy()
        } catch (err) {
          logger.warn('Error destroying PDF during cache clear:', err)
        }
      }
    }

    // Close all cached bitmaps
    for (const [_key, entries] of bitmapCache.value.entries()) {
      for (const entry of entries) {
        try {
          entry.bitmap.close()
        } catch (err) {
          logger.warn('Error closing bitmap during cache clear:', err)
        }
      }
    }

    pdfCache.value.clear()
    bitmapCache.value.clear()
    cacheAccessOrder.value = []
  }

  // Clean up resources when component unmounts
  onBeforeUnmount(() => {
    // Cancel any in-progress render
    if (currentRenderTask) {
      try {
        currentRenderTask.cancel()
      } catch {
        // Ignore cancellation errors
      }
      currentRenderTask = null
    }

    // Clear cache and destroy all PDFs
    clearCache()
  })

  return {
    renderPdfToCanvas,
    getPdfDimensions,
    clearCache,
    isLoading: readonly(isLoading),
    error: readonly(error),
  }
}
