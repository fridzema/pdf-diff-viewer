import * as pdfjsLib from 'pdfjs-dist'

export const usePdfRenderer = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
    isLoading.value = true
    error.value = null

    try {
      console.log('Starting PDF render for:', file.name)

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      console.log('PDF loaded, pages:', pdf.numPages)

      // Get the first page
      const page = await pdf.getPage(1)
      console.log('Page 1 loaded')

      // Calculate viewport
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

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise
      console.log('PDF rendered successfully')
    } catch (err) {
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
   * @returns Object with width and height
   */
  const getPdfDimensions = async (
    file: File
  ): Promise<{ width: number; height: number }> => {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.5 })

    return {
      width: viewport.width,
      height: viewport.height,
    }
  }

  return {
    renderPdfToCanvas,
    getPdfDimensions,
    isLoading: readonly(isLoading),
    error: readonly(error),
  }
}
