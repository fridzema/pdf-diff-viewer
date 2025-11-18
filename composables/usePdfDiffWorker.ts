import { ref, readonly, onUnmounted } from 'vue'
import type { DiffOptions } from './usePdfDiff'
import type { NormalizationStrategy } from './usePdfNormalization'
import { usePdfNormalization } from './usePdfNormalization'
import { ErrorType, createAppError } from '~/utils/errorHandler'
import { logger } from '~/utils/logger'

/**
 * Composable for using Web Worker for PDF diff computation
 * Offloads heavy computation from main thread to prevent UI blocking
 */
export function usePdfDiffWorker() {
  const worker = ref<Worker | null>(null)
  const isProcessing = ref(false)
  const { normalizeCanvases } = usePdfNormalization()

  /**
   * Initialize the worker
   */
  const initWorker = () => {
    if (typeof Worker === 'undefined') {
      logger.warn('Web Workers are not supported in this environment')
      return false
    }

    if (!worker.value) {
      try {
        worker.value = new Worker(new URL('~/workers/pdf-diff.worker.ts', import.meta.url), {
          type: 'module',
        })
      } catch (error) {
        logger.error('Failed to initialize PDF diff worker:', error)
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
    options: DiffOptions,
    normalizationStrategy?: NormalizationStrategy
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
        reject(new Error('Failed to get canvas contexts'))
        return
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

      isProcessing.value = true

      // Set up worker message handler
      const handleMessage = (e: MessageEvent) => {
        const { diffData, originalData, differenceCount, totalPixels, percentDiff } = e.data

        // diffData and originalData are Uint8ClampedArray transferred from worker
        // No need to create new copies - use directly
        const resultImageData = new ImageData(diffData, width, height)
        diffCtx.putImageData(resultImageData, 0, 0)

        isProcessing.value = false

        // Clean up listener
        worker.value?.removeEventListener('message', handleMessage)
        worker.value?.removeEventListener('error', handleWorkerError)

        resolve({
          differenceCount,
          totalPixels,
          percentDiff,
          diffData, // Already Uint8ClampedArray, no copy needed
          originalData, // Already Uint8ClampedArray, no copy needed
        })
      }

      const handleWorkerError = (errorEvent: ErrorEvent) => {
        isProcessing.value = false

        // Clean up listeners
        worker.value?.removeEventListener('message', handleMessage)
        worker.value?.removeEventListener('error', handleWorkerError)

        // Create structured error
        const appError = createAppError(ErrorType.WORKER_CRASH, new Error(errorEvent.message), {
          diffMode: options.mode,
          dimensions: `${width}x${height}`,
        })

        logger.error('Worker error:', appError)
        reject(appError)
      }

      // Attach listeners
      worker.value.addEventListener('message', handleMessage)
      worker.value.addEventListener('error', handleWorkerError)

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
