/**
 * Shared PDF diff algorithms module
 * Used by both main thread (usePdfDiff) and Web Worker (pdf-diff.worker)
 * This prevents code duplication and ensures consistency between implementations
 */

export interface DiffOptions {
  mode: 'pixel' | 'threshold' | 'grayscale' | 'overlay' | 'heatmap'
  threshold: number // 0-255, tolerance for pixel differences
  overlayOpacity: number // 0-1, for overlay mode
  useGrayscale: boolean
}

/**
 * Simple pixel difference - highlights different pixels in red
 */
export function pixelDiff(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  diffData: Uint8ClampedArray,
  _options: DiffOptions,
  originalData?: Uint8ClampedArray
): number {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    const isDifferent = r1 !== r2 || g1 !== g2 || b1 !== b2

    if (isDifferent) {
      // Highlight differences in red
      diffData[i] = 255 // R
      diffData[i + 1] = 0 // G
      diffData[i + 2] = 0 // B
      diffData[i + 3] = 255 // A
      count++
    } else {
      // Keep original pixel (from first image)
      diffData[i] = r1
      diffData[i + 1] = g1
      diffData[i + 2] = b1
      diffData[i + 3] = 255
    }

    // Populate original data (no red highlights) for animation
    if (originalData) {
      originalData[i] = r1
      originalData[i + 1] = g1
      originalData[i + 2] = b1
      originalData[i + 3] = 255
    }
  }

  return count
}

/**
 * Threshold difference - only highlight pixels that differ by more than threshold
 */
export function thresholdDiff(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  diffData: Uint8ClampedArray,
  options: DiffOptions,
  originalData?: Uint8ClampedArray
): number {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    // Calculate color difference
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

    if (diff > options.threshold) {
      // Highlight differences in red
      diffData[i] = 255
      diffData[i + 1] = 0
      diffData[i + 2] = 0
      diffData[i + 3] = 255
      count++
    } else {
      // Keep original pixel
      diffData[i] = r1
      diffData[i + 1] = g1
      diffData[i + 2] = b1
      diffData[i + 3] = 255
    }

    // Populate original data (no red highlights) for animation
    if (originalData) {
      originalData[i] = r1
      originalData[i + 1] = g1
      originalData[i + 2] = b1
      originalData[i + 3] = 255
    }
  }

  return count
}

/**
 * Grayscale difference - convert to grayscale before comparing
 */
export function grayscaleDiff(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  diffData: Uint8ClampedArray,
  options: DiffOptions,
  originalData?: Uint8ClampedArray
): number {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    // Convert to grayscale
    const gray1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2]
    const gray2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2]

    const diff = Math.abs(gray1 - gray2)

    if (diff > options.threshold) {
      // Highlight differences in red
      diffData[i] = 255
      diffData[i + 1] = 0
      diffData[i + 2] = 0
      diffData[i + 3] = 255
      count++
    } else {
      // Show as grayscale
      diffData[i] = gray1
      diffData[i + 1] = gray1
      diffData[i + 2] = gray1
      diffData[i + 3] = 255
    }

    // Populate original data (grayscale without red highlights) for animation
    if (originalData) {
      originalData[i] = gray1
      originalData[i + 1] = gray1
      originalData[i + 2] = gray1
      originalData[i + 3] = 255
    }
  }

  return count
}

/**
 * Overlay mode - blend both images and highlight differences
 */
export function overlayDiff(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  diffData: Uint8ClampedArray,
  options: DiffOptions,
  originalData?: Uint8ClampedArray
): number {
  let count = 0
  const pixels = data1.length
  const opacity = options.overlayOpacity

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

    if (diff > options.threshold) {
      // Blend with red overlay for differences
      diffData[i] = r1 * (1 - opacity) + 255 * opacity
      diffData[i + 1] = g1 * (1 - opacity)
      diffData[i + 2] = b1 * (1 - opacity)
      diffData[i + 3] = 255
      count++
    } else {
      // Blend both images
      diffData[i] = r1 * 0.5 + r2 * 0.5
      diffData[i + 1] = g1 * 0.5 + g2 * 0.5
      diffData[i + 2] = b1 * 0.5 + b2 * 0.5
      diffData[i + 3] = 255
    }

    // Populate original data (blended without red overlay) for animation
    if (originalData) {
      originalData[i] = r1 * 0.5 + r2 * 0.5
      originalData[i + 1] = g1 * 0.5 + g2 * 0.5
      originalData[i + 2] = b1 * 0.5 + b2 * 0.5
      originalData[i + 3] = 255
    }
  }

  return count
}

/**
 * Heatmap mode - show difference intensity with color gradient
 */
export function heatmapDiff(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  diffData: Uint8ClampedArray,
  options: DiffOptions,
  originalData?: Uint8ClampedArray
): number {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    // Calculate normalized difference (0-1)
    const diff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / (255 * 3)

    if (diff > options.threshold / (255 * 3)) {
      count++
    }

    // Apply heatmap colors based on difference intensity
    const heatmapColor = getHeatmapColor(diff)
    diffData[i] = heatmapColor.r
    diffData[i + 1] = heatmapColor.g
    diffData[i + 2] = heatmapColor.b
    diffData[i + 3] = 255

    // Populate original data (blended images) for animation
    if (originalData) {
      originalData[i] = r1 * 0.5 + r2 * 0.5
      originalData[i + 1] = g1 * 0.5 + g2 * 0.5
      originalData[i + 2] = b1 * 0.5 + b2 * 0.5
      originalData[i + 3] = 255
    }
  }

  return count
}

/**
 * Converts difference value (0-1) to heatmap color (blue -> green -> yellow -> red)
 */
export function getHeatmapColor(value: number): { r: number; g: number; b: number } {
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
