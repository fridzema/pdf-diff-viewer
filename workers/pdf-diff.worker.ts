/**
 * Web Worker for PDF Diff Computation
 * Offloads heavy pixel comparison from main thread to prevent UI blocking
 *
 * This worker imports shared diff algorithms from lib/pdfDiffAlgorithms.ts
 * to eliminate code duplication and ensure consistency.
 */

import type { DiffOptions } from '../lib/pdfDiffAlgorithms'
import {
  pixelDiff,
  thresholdDiff,
  grayscaleDiff,
  overlayDiff,
  heatmapDiff,
  semanticDiff,
} from '../lib/pdfDiffAlgorithms'

interface WorkerMessage {
  imageData1: Uint8ClampedArray
  imageData2: Uint8ClampedArray
  options: DiffOptions
  width: number
  height: number
}

interface WorkerResponse {
  diffData: Uint8ClampedArray
  originalData: Uint8ClampedArray
  differenceCount: number
  totalPixels: number
  percentDiff: number
}

/**
 * Main message handler
 */
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
  const { imageData1, imageData2, options, width, height } = e.data

  // Create output arrays
  const diffData = new Uint8ClampedArray(width * height * 4)
  const originalData = new Uint8ClampedArray(width * height * 4)

  // Perform diff based on mode
  let differenceCount = 0

  switch (options.mode) {
    case 'pixel':
      differenceCount = pixelDiff(imageData1, imageData2, diffData, options, originalData)
      break
    case 'threshold':
      differenceCount = thresholdDiff(imageData1, imageData2, diffData, options, originalData)
      break
    case 'grayscale':
      differenceCount = grayscaleDiff(imageData1, imageData2, diffData, options, originalData)
      break
    case 'overlay':
      differenceCount = overlayDiff(imageData1, imageData2, diffData, options, originalData)
      break
    case 'heatmap':
      differenceCount = heatmapDiff(imageData1, imageData2, diffData, options, originalData)
      break
    case 'semantic':
      differenceCount = semanticDiff(imageData1, imageData2, diffData, options, originalData)
      break
  }

  const totalPixels = width * height
  const percentDiff = (differenceCount / totalPixels) * 100

  // Send result back to main thread (transfer both buffers for zero-copy)
  const response: WorkerResponse = {
    diffData,
    originalData,
    differenceCount,
    totalPixels,
    percentDiff,
  }

  self.postMessage(response, [diffData.buffer, originalData.buffer])
}
