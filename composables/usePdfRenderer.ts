import * as pdfjsLib from 'pdfjs-dist'

export const usePdfRenderer = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache for loaded PDF documents to avoid reloading on zoom change
  // Use shallowRef to avoid deep reactivity on PDF.js objects
  const pdfCache = shallowRef<Map<string, { pdf: any; page: any }>>(new Map())

  // Track current render task for cancellation
  let currentRenderTask: any = null

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
      console.log('Cancelling previous render task')
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
      console.log('Starting PDF render for:', file.name, 'at scale:', scale)

      let pdf, page
      const cacheKey = file.name + file.size + file.lastModified

      // Check if PDF is already loaded in cache
      if (pdfCache.value.has(cacheKey)) {
        console.log('Using cached PDF document')
        const cached = pdfCache.value.get(cacheKey)!
        pdf = cached.pdf
        page = cached.page
      } else {
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        pdf = await loadingTask.promise
        console.log('PDF loaded, pages:', pdf.numPages)

        // Get the first page
        page = await pdf.getPage(1)
        console.log('Page 1 loaded')

        // Cache the PDF and page with markRaw to prevent Vue reactivity issues
        pdfCache.value.set(cacheKey, { pdf: markRaw(pdf), page: markRaw(page) })
      }

      // Calculate viewport with the specified scale
      const viewport = page.getViewport({ scale })
      console.log('Viewport:', viewport.width, 'x', viewport.height)

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
      console.log('PDF rendered successfully')
      currentRenderTask = null
    } catch {
      // Check if it was a cancellation
      if (err instanceof Error && err.name === 'RenderingCancelledException') {
        console.log('Render was cancelled')
        return // Don't treat cancellation as an error
      }

      error.value = err instanceof Error ? err.message : 'Failed to render PDF'
      console.error('PDF rendering error:', err)
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
   * Clears the PDF cache (useful when files are changed)
   */
  const clearCache = () => {
    pdfCache.value.clear()
  }

  return {
    renderPdfToCanvas,
    getPdfDimensions,
    clearCache,
    isLoading: readonly(isLoading),
    error: readonly(error),
  }
}
