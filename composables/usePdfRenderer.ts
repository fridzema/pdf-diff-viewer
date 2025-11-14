import * as pdfjsLib from 'pdfjs-dist'
import { logger } from '~/utils/logger'

// Maximum number of PDFs to cache (LRU eviction)
const MAX_CACHE_SIZE = 10

export const usePdfRenderer = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache for loaded PDF documents to avoid reloading on zoom change
  // Use shallowRef to avoid deep reactivity on PDF.js objects
  const pdfCache = shallowRef<Map<string, { pdf: any; page: any }>>(new Map())

  // Track access order for LRU eviction (most recently used = end of array)
  const cacheAccessOrder = ref<string[]>([])

  // Track current render task for cancellation
  let currentRenderTask: any = null

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

      // Set canvas dimensions
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Get canvas context
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas 2d context')
      }

      // Clear canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      // Start rendering and track the task
      currentRenderTask = page.render(renderContext)

      await currentRenderTask.promise
      logger.log('PDF rendered successfully')
      currentRenderTask = null
    } catch (err) {
      // Check if it was a cancellation
      if (err instanceof Error && err.name === 'RenderingCancelledException') {
        logger.log('Render was cancelled')
        return // Don't treat cancellation as an error
      }

      error.value = err instanceof Error ? err.message : 'Failed to render PDF'
      logger.error('PDF rendering error:', err)
      throw err
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

    pdfCache.value.clear()
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
