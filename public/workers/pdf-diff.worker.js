/**
 * Web Worker for PDF Diff Computation
 * Offloads heavy pixel comparison from main thread to prevent UI blocking
 */

/**
 * Pixel difference - highlights different pixels in red
 */
function pixelDiff(data1, data2, diffData, options) {
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
      diffData[i] = 255 // R
      diffData[i + 1] = 0 // G
      diffData[i + 2] = 0 // B
      diffData[i + 3] = 255 // A
      count++
    } else {
      diffData[i] = r1
      diffData[i + 1] = g1
      diffData[i + 2] = b1
      diffData[i + 3] = 255
    }
  }

  return count
}

/**
 * Threshold difference - only highlight pixels that differ by more than threshold
 */
function thresholdDiff(data1, data2, diffData, options) {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

    if (diff > options.threshold) {
      diffData[i] = 255
      diffData[i + 1] = 0
      diffData[i + 2] = 0
      diffData[i + 3] = 255
      count++
    } else {
      diffData[i] = r1
      diffData[i + 1] = g1
      diffData[i + 2] = b1
      diffData[i + 3] = 255
    }
  }

  return count
}

/**
 * Grayscale difference - convert to grayscale before comparing
 */
function grayscaleDiff(data1, data2, diffData, options) {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const gray1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2]
    const gray2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2]

    const diff = Math.abs(gray1 - gray2)

    if (diff > options.threshold) {
      diffData[i] = 255
      diffData[i + 1] = 0
      diffData[i + 2] = 0
      diffData[i + 3] = 255
      count++
    } else {
      diffData[i] = gray1
      diffData[i + 1] = gray1
      diffData[i + 2] = gray1
      diffData[i + 3] = 255
    }
  }

  return count
}

/**
 * Overlay mode - blend both images and highlight differences
 */
function overlayDiff(data1, data2, diffData, options) {
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
      diffData[i] = r1 * (1 - opacity) + 255 * opacity
      diffData[i + 1] = g1 * (1 - opacity)
      diffData[i + 2] = b1 * (1 - opacity)
      diffData[i + 3] = 255
      count++
    } else {
      diffData[i] = r1 * 0.5 + r2 * 0.5
      diffData[i + 1] = g1 * 0.5 + g2 * 0.5
      diffData[i + 2] = b1 * 0.5 + b2 * 0.5
      diffData[i + 3] = 255
    }
  }

  return count
}

/**
 * Heatmap mode - show difference intensity with color gradient
 */
function heatmapDiff(data1, data2, diffData, options) {
  let count = 0
  const pixels = data1.length

  for (let i = 0; i < pixels; i += 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    const diff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / (255 * 3)

    if (diff > options.threshold / (255 * 3)) {
      count++
    }

    const heatmapColor = getHeatmapColor(diff)
    diffData[i] = heatmapColor.r
    diffData[i + 1] = heatmapColor.g
    diffData[i + 2] = heatmapColor.b
    diffData[i + 3] = 255
  }

  return count
}

/**
 * Converts difference value (0-1) to heatmap color (blue -> green -> yellow -> red)
 */
function getHeatmapColor(value) {
  if (value < 0.25) {
    const ratio = value / 0.25
    return { r: 0, g: Math.floor(ratio * 255), b: 255 }
  } else if (value < 0.5) {
    const ratio = (value - 0.25) / 0.25
    return { r: 0, g: 255, b: Math.floor(255 * (1 - ratio)) }
  } else if (value < 0.75) {
    const ratio = (value - 0.5) / 0.25
    return { r: Math.floor(ratio * 255), g: 255, b: 0 }
  } else {
    const ratio = (value - 0.75) / 0.25
    return { r: 255, g: Math.floor(255 * (1 - ratio)), b: 0 }
  }
}

/**
 * Main message handler
 */
self.onmessage = function (e) {
  const { imageData1, imageData2, options, width, height } = e.data

  // Create output array
  const diffData = new Uint8ClampedArray(width * height * 4)

  // Perform diff based on mode
  let differenceCount = 0

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

  const totalPixels = width * height
  const percentDiff = (differenceCount / totalPixels) * 100

  // Send result back to main thread
  self.postMessage(
    {
      diffData,
      differenceCount,
      totalPixels,
      percentDiff,
    },
    [diffData.buffer]
  )
}
