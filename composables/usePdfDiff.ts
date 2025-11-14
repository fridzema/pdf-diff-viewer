export type DiffMode = 'pixel' | 'threshold' | 'grayscale' | 'overlay' | 'heatmap'

export interface DiffOptions {
  mode: DiffMode
  threshold: number // 0-255, tolerance for pixel differences
  overlayOpacity: number // 0-1, for overlay mode
  useGrayscale: boolean
}

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

    // Process based on selected mode
    switch (options.mode) {
      case 'pixel':
        differenceCount = pixelDiff(imageData1, imageData2, diffData, options)
        break
      case 'threshold':
        differenceCount = thresholdDiff(imageData1, imageData2, diffData, options)
        break
      case 'grayscale':
        differenceCount = grayscaleDiff(imageData1, imageData2, diffData, options)
        break
      case 'overlay':
        differenceCount = overlayDiff(imageData1, imageData2, diffData, options)
        break
      case 'heatmap':
        differenceCount = heatmapDiff(imageData1, imageData2, diffData, options)
        break
    }

    // Put the diff data on the canvas
    diffCtx.putImageData(diffData, 0, 0)

    const percentDiff = (differenceCount / totalPixels) * 100

    return { differenceCount, totalPixels, percentDiff }
  }

  /**
   * Simple pixel difference - highlights different pixels in red
   */
  const pixelDiff = (
    data1: ImageData,
    data2: ImageData,
    diffData: ImageData,
    _options: DiffOptions
  ): number => {
    let count = 0
    const pixels = data1.data.length

    for (let i = 0; i < pixels; i += 4) {
      const r1 = data1.data[i]
      const g1 = data1.data[i + 1]
      const b1 = data1.data[i + 2]

      const r2 = data2.data[i]
      const g2 = data2.data[i + 1]
      const b2 = data2.data[i + 2]

      const isDifferent = r1 !== r2 || g1 !== g2 || b1 !== b2

      if (isDifferent) {
        // Highlight differences in red
        diffData.data[i] = 255 // R
        diffData.data[i + 1] = 0 // G
        diffData.data[i + 2] = 0 // B
        diffData.data[i + 3] = 255 // A
        count++
      } else {
        // Keep original pixel (from first image)
        diffData.data[i] = r1
        diffData.data[i + 1] = g1
        diffData.data[i + 2] = b1
        diffData.data[i + 3] = 255
      }
    }

    return count
  }

  /**
   * Threshold difference - only highlight pixels that differ by more than threshold
   */
  const thresholdDiff = (
    data1: ImageData,
    data2: ImageData,
    diffData: ImageData,
    options: DiffOptions
  ): number => {
    let count = 0
    const pixels = data1.data.length

    for (let i = 0; i < pixels; i += 4) {
      const r1 = data1.data[i]
      const g1 = data1.data[i + 1]
      const b1 = data1.data[i + 2]

      const r2 = data2.data[i]
      const g2 = data2.data[i + 1]
      const b2 = data2.data[i + 2]

      // Calculate color difference
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

      if (diff > options.threshold) {
        // Highlight differences in red
        diffData.data[i] = 255
        diffData.data[i + 1] = 0
        diffData.data[i + 2] = 0
        diffData.data[i + 3] = 255
        count++
      } else {
        // Keep original pixel
        diffData.data[i] = r1
        diffData.data[i + 1] = g1
        diffData.data[i + 2] = b1
        diffData.data[i + 3] = 255
      }
    }

    return count
  }

  /**
   * Grayscale difference - convert to grayscale before comparing
   */
  const grayscaleDiff = (
    data1: ImageData,
    data2: ImageData,
    diffData: ImageData,
    options: DiffOptions
  ): number => {
    let count = 0
    const pixels = data1.data.length

    for (let i = 0; i < pixels; i += 4) {
      // Convert to grayscale
      const gray1 = 0.299 * data1.data[i] + 0.587 * data1.data[i + 1] + 0.114 * data1.data[i + 2]
      const gray2 = 0.299 * data2.data[i] + 0.587 * data2.data[i + 1] + 0.114 * data2.data[i + 2]

      const diff = Math.abs(gray1 - gray2)

      if (diff > options.threshold) {
        // Highlight differences in red
        diffData.data[i] = 255
        diffData.data[i + 1] = 0
        diffData.data[i + 2] = 0
        diffData.data[i + 3] = 255
        count++
      } else {
        // Show as grayscale
        diffData.data[i] = gray1
        diffData.data[i + 1] = gray1
        diffData.data[i + 2] = gray1
        diffData.data[i + 3] = 255
      }
    }

    return count
  }

  /**
   * Overlay mode - blend both images and highlight differences
   */
  const overlayDiff = (
    data1: ImageData,
    data2: ImageData,
    diffData: ImageData,
    options: DiffOptions
  ): number => {
    let count = 0
    const pixels = data1.data.length
    const opacity = options.overlayOpacity

    for (let i = 0; i < pixels; i += 4) {
      const r1 = data1.data[i]
      const g1 = data1.data[i + 1]
      const b1 = data1.data[i + 2]

      const r2 = data2.data[i]
      const g2 = data2.data[i + 1]
      const b2 = data2.data[i + 2]

      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

      if (diff > options.threshold) {
        // Blend with red overlay for differences
        diffData.data[i] = r1 * (1 - opacity) + 255 * opacity
        diffData.data[i + 1] = g1 * (1 - opacity)
        diffData.data[i + 2] = b1 * (1 - opacity)
        diffData.data[i + 3] = 255
        count++
      } else {
        // Blend both images
        diffData.data[i] = r1 * 0.5 + r2 * 0.5
        diffData.data[i + 1] = g1 * 0.5 + g2 * 0.5
        diffData.data[i + 2] = b1 * 0.5 + b2 * 0.5
        diffData.data[i + 3] = 255
      }
    }

    return count
  }

  /**
   * Heatmap mode - show difference intensity with color gradient
   */
  const heatmapDiff = (
    data1: ImageData,
    data2: ImageData,
    diffData: ImageData,
    options: DiffOptions
  ): number => {
    let count = 0
    const pixels = data1.data.length

    for (let i = 0; i < pixels; i += 4) {
      const r1 = data1.data[i]
      const g1 = data1.data[i + 1]
      const b1 = data1.data[i + 2]

      const r2 = data2.data[i]
      const g2 = data2.data[i + 1]
      const b2 = data2.data[i + 2]

      // Calculate normalized difference (0-1)
      const diff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / (255 * 3)

      if (diff > options.threshold / (255 * 3)) {
        count++
      }

      // Apply heatmap colors based on difference intensity
      const heatmapColor = getHeatmapColor(diff)
      diffData.data[i] = heatmapColor.r
      diffData.data[i + 1] = heatmapColor.g
      diffData.data[i + 2] = heatmapColor.b
      diffData.data[i + 3] = 255
    }

    return count
  }

  /**
   * Converts difference value (0-1) to heatmap color (blue -> green -> yellow -> red)
   */
  const getHeatmapColor = (value: number): { r: number; g: number; b: number } => {
    if (value < 0.25) {
      // Blue to Cyan
      const ratio = value / 0.25
      return { r: 0, g: Math.floor(ratio * 255), b: 255 }
    } else if (value < 0.5) {
      // Cyan to Green
      const ratio = (value - 0.25) / 0.25
      return { r: 0, g: 255, b: Math.floor(255 * (1 - ratio)) }
    } else if (value < 0.75) {
      // Green to Yellow
      const ratio = (value - 0.5) / 0.25
      return { r: Math.floor(ratio * 255), g: 255, b: 0 }
    } else {
      // Yellow to Red
      const ratio = (value - 0.75) / 0.25
      return { r: 255, g: Math.floor(255 * (1 - ratio)), b: 0 }
    }
  }

  return {
    comparePdfs,
  }
}
