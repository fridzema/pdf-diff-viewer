/**
 * PDF Layout Normalization Composable
 * Handles PDFs with different dimensions/trim boxes by aligning and scaling appropriately
 */

import { getCanvasPool } from '~/utils/canvas-pool'

export interface NormalizedDimensions {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
}

export type NormalizationStrategyType = 'largest' | 'smallest' | 'first' | 'second' | 'custom'
export type AlignmentType = 'top-left' | 'center' | 'top-center'

export interface NormalizationStrategy {
  type: NormalizationStrategyType
  alignment: AlignmentType
  backgroundColor: string // For padding areas
  scaleToFit: boolean
}

export function usePdfNormalization() {
  /**
   * Calculate normalized dimensions for two canvases
   */
  const calculateNormalizedDimensions = (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    strategy: NormalizationStrategy
  ): {
    targetWidth: number
    targetHeight: number
    canvas1Transform: NormalizedDimensions
    canvas2Transform: NormalizedDimensions
  } => {
    // Determine target dimensions based on strategy
    let targetWidth: number
    let targetHeight: number

    switch (strategy.type) {
      case 'largest':
        targetWidth = Math.max(canvas1.width, canvas2.width)
        targetHeight = Math.max(canvas1.height, canvas2.height)
        break
      case 'smallest':
        targetWidth = Math.min(canvas1.width, canvas2.width)
        targetHeight = Math.min(canvas1.height, canvas2.height)
        break
      case 'first':
        targetWidth = canvas1.width
        targetHeight = canvas1.height
        break
      case 'second':
        targetWidth = canvas2.width
        targetHeight = canvas2.height
        break
      default:
        targetWidth = Math.max(canvas1.width, canvas2.width)
        targetHeight = Math.max(canvas1.height, canvas2.height)
    }

    // Calculate transforms for each canvas
    const canvas1Transform = calculateTransform(canvas1, targetWidth, targetHeight, strategy)

    const canvas2Transform = calculateTransform(canvas2, targetWidth, targetHeight, strategy)

    return {
      targetWidth,
      targetHeight,
      canvas1Transform,
      canvas2Transform,
    }
  }

  /**
   * Calculate transform for a single canvas
   */
  const calculateTransform = (
    canvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    strategy: NormalizationStrategy
  ): NormalizedDimensions => {
    let scale = 1
    let offsetX = 0
    let offsetY = 0

    if (strategy.scaleToFit) {
      // Scale to fit within target dimensions (preserve aspect ratio)
      const scaleX = targetWidth / canvas.width
      const scaleY = targetHeight / canvas.height
      scale = Math.min(scaleX, scaleY)
    }

    const scaledWidth = canvas.width * scale
    const scaledHeight = canvas.height * scale

    // Calculate alignment offset
    switch (strategy.alignment) {
      case 'center':
        offsetX = (targetWidth - scaledWidth) / 2
        offsetY = (targetHeight - scaledHeight) / 2
        break
      case 'top-center':
        offsetX = (targetWidth - scaledWidth) / 2
        offsetY = 0
        break
      case 'top-left':
      default:
        offsetX = 0
        offsetY = 0
    }

    return {
      width: scaledWidth,
      height: scaledHeight,
      scale,
      offsetX,
      offsetY,
    }
  }

  /**
   * Normalize two canvases to a new output canvas
   * This creates two new canvases with identical dimensions
   */
  const normalizeCanvases = (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    strategy: NormalizationStrategy
  ): {
    normalizedCanvas1: HTMLCanvasElement
    normalizedCanvas2: HTMLCanvasElement
    dimensions: ReturnType<typeof calculateNormalizedDimensions>
  } => {
    const dimensions = calculateNormalizedDimensions(canvas1, canvas2, strategy)

    // Get canvas pool for reusable canvases (20-30% memory reduction)
    const pool = getCanvasPool()

    // Acquire normalized canvases from pool (dimensions are set by pool.acquire)
    const normalizedCanvas1 = pool.acquire(dimensions.targetWidth, dimensions.targetHeight)
    const normalizedCanvas2 = pool.acquire(dimensions.targetWidth, dimensions.targetHeight)

    // Get contexts
    const ctx1 = normalizedCanvas1.getContext('2d')
    const ctx2 = normalizedCanvas2.getContext('2d')

    if (!ctx1 || !ctx2) {
      throw new Error('Failed to get canvas contexts for normalization')
    }

    // Fill background
    ctx1.fillStyle = strategy.backgroundColor
    ctx1.fillRect(0, 0, dimensions.targetWidth, dimensions.targetHeight)
    ctx2.fillStyle = strategy.backgroundColor
    ctx2.fillRect(0, 0, dimensions.targetWidth, dimensions.targetHeight)

    // Draw scaled and positioned canvases
    const t1 = dimensions.canvas1Transform
    ctx1.drawImage(canvas1, t1.offsetX, t1.offsetY, t1.width, t1.height)

    const t2 = dimensions.canvas2Transform
    ctx2.drawImage(canvas2, t2.offsetX, t2.offsetY, t2.width, t2.height)

    return {
      normalizedCanvas1,
      normalizedCanvas2,
      dimensions,
    }
  }

  return {
    calculateNormalizedDimensions,
    calculateTransform,
    normalizeCanvases,
  }
}
