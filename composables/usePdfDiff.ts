import {
  pixelDiff,
  thresholdDiff,
  grayscaleDiff,
  overlayDiff,
  heatmapDiff,
  semanticDiff,
  type DiffOptions,
} from '~/lib/pdfDiffAlgorithms'
import type { NormalizationStrategy } from './usePdfNormalization'
import { usePdfNormalization } from './usePdfNormalization'
import { WebGLDiffRenderer, isWebGL2Supported } from '~/lib/webgl-diff-renderer'
import { logger } from '~/utils/logger'

export type DiffMode =
  | 'pixel'
  | 'threshold'
  | 'grayscale'
  | 'overlay'
  | 'heatmap'
  | 'semantic'
  | 'webgl'
export type { DiffOptions }

export const usePdfDiff = () => {
  const { normalizeCanvases } = usePdfNormalization()

  /**
   * Compares two canvases pixel by pixel and creates a diff canvas
   * @param canvas1 - First canvas to compare
   * @param canvas2 - Second canvas to compare
   * @param diffCanvas - Canvas to render the diff result
   * @param options - Diff options (mode, threshold, etc.)
   * @param normalizationStrategy - Optional normalization strategy for handling different dimensions
   */
  const comparePdfs = (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement,
    options: DiffOptions,
    normalizationStrategy?: NormalizationStrategy
  ): { differenceCount: number; totalPixels: number; percentDiff: number } => {
    // Normalize canvases before comparison (fixes dimension mismatch issues)
    const strategy = normalizationStrategy ?? {
      type: 'largest' as const,
      alignment: 'top-left' as const,
      backgroundColor: '#ffffff',
      scaleToFit: false,
    }

    const { normalizedCanvas1, normalizedCanvas2 } = normalizeCanvases(canvas1, canvas2, strategy)

    const ctx1 = normalizedCanvas1.getContext('2d')
    const ctx2 = normalizedCanvas2.getContext('2d')
    const diffCtx = diffCanvas.getContext('2d')

    if (!ctx1 || !ctx2 || !diffCtx) {
      throw new Error('Failed to get canvas contexts')
    }

    // Now both canvases have the same dimensions (normalized)
    const width = normalizedCanvas1.width
    const height = normalizedCanvas1.height

    // Set diff canvas dimensions
    diffCanvas.width = width
    diffCanvas.height = height

    // Get image data from normalized canvases
    const imageData1 = ctx1.getImageData(0, 0, width, height)
    const imageData2 = ctx2.getImageData(0, 0, width, height)
    const diffData = diffCtx.createImageData(width, height)

    let differenceCount = 0
    const totalPixels = width * height

    // Process based on selected mode (using shared algorithms from lib/pdfDiffAlgorithms)
    switch (options.mode) {
      case 'webgl': {
        // Use WebGL-accelerated rendering (3-5x faster)
        if (!isWebGL2Supported()) {
          logger.warn('WebGL 2 not supported, falling back to pixel mode')
          differenceCount = pixelDiff(imageData1.data, imageData2.data, diffData.data, options)
          diffCtx.putImageData(diffData, 0, 0)
          break
        }

        try {
          const renderer = new WebGLDiffRenderer(diffCanvas)
          const result = renderer.renderDiff(normalizedCanvas1, normalizedCanvas2, diffCanvas, {
            threshold: options.threshold,
            overlayOpacity: options.overlayOpacity,
            useGrayscale: options.useGrayscale,
          })
          renderer.dispose()

          // WebGL renders directly to canvas, no need to putImageData
          return result
        } catch (error) {
          logger.error('WebGL rendering failed, falling back to pixel mode:', error)
          differenceCount = pixelDiff(imageData1.data, imageData2.data, diffData.data, options)
          diffCtx.putImageData(diffData, 0, 0)
        }
        break
      }
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
      case 'semantic':
        differenceCount = semanticDiff(imageData1.data, imageData2.data, diffData.data, options)
        break
    }

    // Put the diff data on the canvas (except for WebGL which renders directly)
    if (options.mode !== 'webgl') {
      diffCtx.putImageData(diffData, 0, 0)
    }

    const percentDiff = (differenceCount / totalPixels) * 100

    return { differenceCount, totalPixels, percentDiff }
  }

  return {
    comparePdfs,
  }
}
