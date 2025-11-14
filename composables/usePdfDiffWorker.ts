import { ref, readonly, onUnmounted } from 'vue'
import type { DiffOptions } from './usePdfDiff'

/**
 * Composable for using Web Worker for PDF diff computation
 * Offloads heavy computation from main thread to prevent UI blocking
 */
export function usePdfDiffWorker() {
  const worker = ref<Worker | null>(null)
  const isProcessing = ref(false)

  /**
   * Initialize the worker
   */
  const initWorker = () => {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers are not supported in this environment')
      return false
    }

    if (!worker.value) {
      try {
        worker.value = new Worker('/workers/pdf-diff.worker.js')
      } catch (error) {
        console.error('Failed to initialize PDF diff worker:', error)
        return false
      }
    }

    return true
  }

  /**
   * Compare PDFs using Web Worker
   */
  const comparePdfsAsync = (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement,
    options: DiffOptions
  ): Promise<{
    differenceCount: number
    totalPixels: number
    percentDiff: number
    diffData: Uint8ClampedArray
    originalData: Uint8ClampedArray
  }> => {
    return new Promise((resolve, reject) => {
      if (!initWorker() || !worker.value) {
        reject(new Error('Worker initialization failed'))
        return
      }

      const ctx1 = canvas1.getContext('2d', { willReadFrequently: true })
      const ctx2 = canvas2.getContext('2d', { willReadFrequently: true })
      const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true })

      if (!ctx1 || !ctx2 || !diffCtx) {
        reject(new Error('Failed to get canvas contexts'))
        return
      }

      const width = canvas1.width
      const height = canvas1.height

      // Set diff canvas dimensions
      diffCanvas.width = width
      diffCanvas.height = height

      // Get image data
      const imageData1 = ctx1.getImageData(0, 0, width, height)
      const imageData2 = ctx2.getImageData(0, 0, width, height)

      isProcessing.value = true

      // Set up worker message handler
      const handleMessage = (e: MessageEvent) => {
        const { diffData, originalData, differenceCount, totalPixels, percentDiff } = e.data

        // Put the diff data on the canvas
        const resultImageData = new ImageData(new Uint8ClampedArray(diffData), width, height)
        diffCtx.putImageData(resultImageData, 0, 0)

        isProcessing.value = false

        // Clean up listener
        worker.value?.removeEventListener('message', handleMessage)
        worker.value?.removeEventListener('error', handleError)

        resolve({
          differenceCount,
          totalPixels,
          percentDiff,
          diffData: new Uint8ClampedArray(diffData),
          originalData: new Uint8ClampedArray(originalData),
        })
      }

      const handleError = (error: ErrorEvent) => {
        isProcessing.value = false

        // Clean up listeners
        worker.value?.removeEventListener('message', handleMessage)
        worker.value?.removeEventListener('error', handleError)

        reject(new Error(`Worker error: ${error.message}`))
      }

      // Attach listeners
      worker.value.addEventListener('message', handleMessage)
      worker.value.addEventListener('error', handleError)

      // Send data to worker
      // Use transferable objects for better performance
      // Convert options to plain object to avoid cloning issues with Vue reactivity
      worker.value.postMessage(
        {
          imageData1: imageData1.data,
          imageData2: imageData2.data,
          options: {
            mode: options.mode,
            threshold: options.threshold,
            overlayOpacity: options.overlayOpacity,
            useGrayscale: options.useGrayscale,
          },
          width,
          height,
        },
        [imageData1.data.buffer, imageData2.data.buffer]
      )
    })
  }

  /**
   * Terminate the worker
   */
  const terminateWorker = () => {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
    }
  }

  // Clean up on unmount
  onUnmounted(() => {
    terminateWorker()
  })

  return {
    comparePdfsAsync,
    isProcessing: readonly(isProcessing),
    terminateWorker,
  }
}
