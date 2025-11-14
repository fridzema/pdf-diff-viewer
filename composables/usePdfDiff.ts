import {
  pixelDiff,
  thresholdDiff,
  grayscaleDiff,
  overlayDiff,
  heatmapDiff,
  type DiffOptions,
} from '~/lib/pdfDiffAlgorithms'

export type DiffMode = 'pixel' | 'threshold' | 'grayscale' | 'overlay' | 'heatmap'
export type { DiffOptions }

export const usePdfDiff = () => {
  /**
   * Compares two canvases pixel by pixel and creates a diff canvas
   * @param canvas1 - First canvas to compare
   * @param canvas2 - Second canvas to compare
   * @param diffCanvas - Canvas to render the diff result
   * @param options - Diff options (mode, threshold, etc.)
   */
  const comparePdfs = (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement,
    options: DiffOptions
  ): { differenceCount: number; totalPixels: number; percentDiff: number } => {
    const ctx1 = canvas1.getContext('2d', { willReadFrequently: true })
    const ctx2 = canvas2.getContext('2d', { willReadFrequently: true })
    const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true })

    if (!ctx1 || !ctx2 || !diffCtx) {
      throw new Error('Failed to get canvas contexts')
    }

    // Use the dimensions of the first canvas
    const width = canvas1.width
    const height = canvas1.height

    // Set diff canvas dimensions to match
    diffCanvas.width = width
    diffCanvas.height = height

    // Get image data from both canvases
    const imageData1 = ctx1.getImageData(0, 0, width, height)
    const imageData2 = ctx2.getImageData(0, 0, width, height)
    const diffData = diffCtx.createImageData(width, height)

    let differenceCount = 0
    const totalPixels = width * height

    // Process based on selected mode (using shared algorithms from lib/pdfDiffAlgorithms)
    switch (options.mode) {
      case 'pixel':
        differenceCount = pixelDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
      case 'threshold':
        differenceCount = thresholdDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
      case 'grayscale':
        differenceCount = grayscaleDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
      case 'overlay':
        differenceCount = overlayDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
      case 'heatmap':
        differenceCount = heatmapDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
    }

    // Put the diff data on the canvas
    diffCtx.putImageData(diffData, 0, 0)

    const percentDiff = (differenceCount / totalPixels) * 100

    return { differenceCount, totalPixels, percentDiff }
  }

  return {
    comparePdfs,
  }
}
