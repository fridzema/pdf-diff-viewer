<template>
  <div class="pdf-diff-container">
    <!-- Control Panel -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Comparison Settings</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Diff Mode Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Comparison Mode </label>
          <select
            v-model="diffOptions.mode"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="runComparison"
          >
            <option value="pixel">Pixel Difference</option>
            <option value="threshold">Threshold Mode</option>
            <option value="grayscale">Grayscale Diff</option>
            <option value="overlay">Color Overlay</option>
            <option value="heatmap">Heatmap</option>
          </select>
          <p class="mt-1 text-xs text-gray-500">{{ getModeDescription(diffOptions.mode) }}</p>
        </div>

        <!-- Threshold Slider -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Sensitivity Threshold: {{ diffOptions.threshold }}
          </label>
          <input
            v-model.number="diffOptions.threshold"
            type="range"
            min="0"
            max="255"
            step="1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            @input="runComparison"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Less Sensitive</span>
            <span>More Sensitive</span>
          </div>
        </div>

        <!-- Overlay Opacity Slider (only for overlay mode) -->
        <div v-if="diffOptions.mode === 'overlay'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Overlay Opacity: {{ (diffOptions.overlayOpacity * 100).toFixed(0) }}%
          </label>
          <input
            v-model.number="diffOptions.overlayOpacity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            @input="runComparison"
          />
        </div>

        <!-- Grayscale Toggle -->
        <div class="flex items-center">
          <input
            v-model="diffOptions.useGrayscale"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            @change="runComparison"
          />
          <label class="ml-2 text-sm text-gray-700"> Convert to grayscale before comparing </label>
        </div>

        <!-- Sync Panning Toggle -->
        <div class="flex items-center">
          <input
            v-model="syncPanningEnabled"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label class="ml-2 text-sm text-gray-700"> Sync panning between PDFs </label>
        </div>

        <!-- Animation Toggle -->
        <div class="flex items-center">
          <input
            v-model="animationEnabled"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label class="ml-2 text-sm text-gray-700"> Animate differences (blink) </label>
        </div>

        <!-- Animation Speed Slider (only shown when animation is enabled) -->
        <div v-if="animationEnabled">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Animation Speed: {{ animationSpeed }}ms
          </label>
          <input
            v-model.number="animationSpeed"
            type="range"
            min="200"
            max="2000"
            step="100"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Faster</span>
            <span>Slower</span>
          </div>
        </div>
      </div>

      <!-- Comparison Button -->
      <div class="mt-6">
        <button
          :disabled="!canCompare || isProcessing"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          @click="runComparison"
        >
          <svg
            v-if="isProcessing"
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ isProcessing ? 'Processing...' : 'Run Comparison' }}</span>
        </button>
      </div>

      <!-- Stats Display -->
      <div v-if="stats" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Comparison Results</h3>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Different Pixels:</span>
            <span class="font-semibold text-gray-900 ml-2">{{
              stats.differenceCount.toLocaleString()
            }}</span>
          </div>
          <div>
            <span class="text-gray-600">Total Pixels:</span>
            <span class="font-semibold text-gray-900 ml-2">{{
              stats.totalPixels.toLocaleString()
            }}</span>
          </div>
          <div>
            <span class="text-gray-600">Difference:</span>
            <span
              class="font-semibold ml-2"
              :class="stats.percentDiff > 5 ? 'text-red-600' : 'text-green-600'"
            >
              {{ stats.percentDiff.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Canvas Display - 2 Row Layout -->
    <div class="space-y-6">
      <!-- Row 1: Source PDFs Side-by-Side (Collapsible) -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <!-- Collapsible Header -->
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          @click="sourcePdfsExpanded = !sourcePdfsExpanded"
        >
          <h3 class="text-lg font-semibold text-gray-800">Source PDFs</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': !sourcePdfsExpanded }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Collapsible Content -->
        <transition name="expand" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
          <div v-show="sourcePdfsExpanded" class="overflow-hidden">
            <div class="p-6 pt-2">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left PDF -->
                <div>
                  <PdfCanvas
                    ref="leftCanvasComponent"
                    v-model:zoom="sourceZoom"
                    :file="leftFile"
                    title="PDF 1"
                  />
                </div>

                <!-- Right PDF -->
                <div>
                  <PdfCanvas
                    ref="rightCanvasComponent"
                    v-model:zoom="sourceZoom"
                    :file="rightFile"
                    title="PDF 2"
                  />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Row 2: Difference View Full Width -->
      <div class="relative">
        <div class="mb-3 text-sm font-semibold text-gray-700">Difference View</div>

        <!-- Zoom Controls for Diff View -->
        <div class="mb-3">
          <PdfViewerControls v-model="diffZoom" />
        </div>

        <!-- Diff Canvas -->
        <div
          class="canvas-wrapper border border-gray-300 rounded-lg overflow-auto bg-gray-50 relative"
        >
          <!-- Loading overlay -->
          <div
            v-if="isRecomputingDiff"
            class="absolute inset-0 bg-white/80 flex items-center justify-center z-10"
          >
            <div class="flex items-center gap-2 text-sm text-gray-700">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Re-rendering at {{ diffZoom }}%...
            </div>
          </div>

          <!-- Canvas with smart scaling -->
          <canvas ref="diffCanvas" :style="diffCanvasStyle"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logger } from '~/utils/logger'
import type { DiffMode, DiffOptions } from '~/composables/usePdfDiff'

const props = defineProps<{
  leftFile: File | null
  rightFile: File | null
}>()

const leftCanvasComponent = ref<any>(null)
const rightCanvasComponent = ref<any>(null)
const diffCanvas = ref<HTMLCanvasElement | null>(null)

const { comparePdfsAsync, isProcessing } = usePdfDiffWorker()
const { renderPdfToCanvas } = usePdfRenderer()

// Reusable temp canvases for diff recomputation (Phase 1.2 optimization)
const tempCanvas1 = ref<HTMLCanvasElement>(document.createElement('canvas'))
const tempCanvas2 = ref<HTMLCanvasElement>(document.createElement('canvas'))

// Zoom state management
const sourceZoom = ref(100) // Synced zoom for both source PDFs (100% = 1.0 scale)
const diffZoom = ref(100) // Independent zoom for difference view
const diffRenderZoom = ref(100) // Actual rendered zoom of diff canvas
const isRecomputingDiff = ref(false)

// Timeout tracking for cleanup (prevent memory leaks)
const pollingTimeoutId = ref<number | null>(null)
const zoomTimeoutId = ref<number | null>(null)

// Debounce diff zoom for smart re-rendering
const debouncedDiffZoom = useDebounce(
  computed(() => diffZoom.value),
  500
)

// Track if diff zoom is in debounce period (for CSS-scale fallback)
const isDiffDebouncing = computed(() => diffZoom.value !== debouncedDiffZoom.value)

// Scroll sync state
const syncPanningEnabled = ref(true)

// Collapsible source PDFs state (open by default)
const sourcePdfsExpanded = ref(true)

// Animation state
const animationEnabled = ref(false)
const animationSpeed = ref(500) // milliseconds
const showingDiff = ref(true)
const animationIntervalId = ref<number | null>(null)
const diffImageData = ref<Uint8ClampedArray | null>(null)
const originalImageData = ref<Uint8ClampedArray | null>(null)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

const diffOptions = ref<DiffOptions>({
  mode: 'pixel',
  threshold: 10,
  overlayOpacity: 0.5,
  useGrayscale: false,
})

const stats = ref<{
  differenceCount: number
  totalPixels: number
  percentDiff: number
} | null>(null)

const canCompare = computed(() => {
  return props.leftFile !== null && props.rightFile !== null
})

// Scroll synchronization between source PDFs
const leftWrapper = computed(() => leftCanvasComponent.value?.canvasWrapper)
const rightWrapper = computed(() => rightCanvasComponent.value?.canvasWrapper)

useScrollSync(leftWrapper, rightWrapper, { enabled: syncPanningEnabled })

// CSS scaling for diff canvas during debounce (instant zoom feedback)
const diffCanvasStyle = computed(() => {
  // Calculate scale ratio for immediate visual feedback
  const transformScale =
    isDiffDebouncing.value && diffRenderZoom.value > 0 ? diffZoom.value / diffRenderZoom.value : 1

  return {
    display: 'block',
    transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
    transformOrigin: 'top left',
    transition: 'none', // No transition for instant feedback
  }
})

// Transition handlers for smooth collapse/expand animation
const onEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.opacity = '0'
}

const onAfterEnter = (el: HTMLElement) => {
  el.style.height = 'auto'
  el.style.opacity = '1'
  el.style.transition = 'height 0.3s ease-out, opacity 0.3s ease-out'
}

const onLeave = (el: HTMLElement) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.opacity = '1'

  // Force reflow (intentionally reading offsetHeight to trigger layout)
  void el.offsetHeight

  el.style.transition = 'height 0.3s ease-in, opacity 0.3s ease-in'
  el.style.height = '0'
  el.style.opacity = '0'
}

const getModeDescription = (mode: DiffMode): string => {
  const descriptions: Record<DiffMode, string> = {
    pixel: 'Highlights all different pixels in red',
    threshold: 'Only highlights pixels that differ by more than the threshold',
    grayscale: 'Converts to grayscale before comparing',
    overlay: 'Blends both PDFs with red highlights for differences',
    heatmap: 'Shows difference intensity with color gradient (blue → red)',
  }
  return descriptions[mode]
}

// Animation control functions
const startAnimation = () => {
  if (!diffImageData.value || !originalImageData.value || !diffCanvas.value) {
    logger.warn('Cannot start animation: missing image data or canvas')
    return
  }

  // Clear any existing interval
  stopAnimation()

  logger.log('Starting blink animation at', animationSpeed.value, 'ms interval')

  // Create the animation interval
  animationIntervalId.value = setInterval(() => {
    if (!diffCanvas.value) return

    const ctx = diffCanvas.value.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Toggle between showing diff and original
    showingDiff.value = !showingDiff.value

    const dataToShow = showingDiff.value ? diffImageData.value : originalImageData.value
    if (dataToShow) {
      const imageData = new ImageData(dataToShow, canvasWidth.value, canvasHeight.value)
      ctx.putImageData(imageData, 0, 0)
    }
  }, animationSpeed.value) as unknown as number
}

const stopAnimation = () => {
  if (animationIntervalId.value !== null) {
    clearInterval(animationIntervalId.value)
    animationIntervalId.value = null
    logger.log('Stopped blink animation')
  }

  // Ensure we're showing the diff data when animation stops
  if (diffImageData.value && diffCanvas.value) {
    showingDiff.value = true
    const ctx = diffCanvas.value.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      const imageData = new ImageData(diffImageData.value, canvasWidth.value, canvasHeight.value)
      ctx.putImageData(imageData, 0, 0)
    }
  }
}

// Recompute diff at a specific zoom level (re-renders PDFs at new resolution)
const recomputeDiffAtZoom = async (targetZoom: number) => {
  if (isRecomputingDiff.value || !canCompare.value) return

  isRecomputingDiff.value = true

  // Stop animation before recomputing
  stopAnimation()

  try {
    logger.log('Recomputing diff at zoom:', targetZoom)

    const scale = targetZoom / 100

    // Render both PDFs at the target zoom level (reusing temp canvases)
    await renderPdfToCanvas(props.leftFile!, tempCanvas1.value, scale)
    await renderPdfToCanvas(props.rightFile!, tempCanvas2.value, scale)

    // Run comparison at high resolution using Web Worker
    const result = await comparePdfsAsync(
      tempCanvas1.value,
      tempCanvas2.value,
      diffCanvas.value!,
      diffOptions.value
    )

    stats.value = {
      differenceCount: result.differenceCount,
      totalPixels: result.totalPixels,
      percentDiff: result.percentDiff,
    }

    // Store both image data arrays for animation
    diffImageData.value = result.diffData
    originalImageData.value = result.originalData
    canvasWidth.value = diffCanvas.value!.width
    canvasHeight.value = diffCanvas.value!.height

    diffRenderZoom.value = targetZoom
    logger.log('Diff recomputed successfully at', targetZoom, '%')

    // Restart animation if it was enabled
    if (animationEnabled.value) {
      startAnimation()
    }
  } catch (err) {
    logger.error('Failed to recompute diff:', err)
  } finally {
    isRecomputingDiff.value = false
  }
}

const runComparison = async () => {
  if (!canCompare.value) return

  // Access the canvas element (already unwrapped via computed)
  const leftCanvas = leftCanvasComponent.value?.canvas
  const rightCanvas = rightCanvasComponent.value?.canvas

  logger.log('Running comparison with canvases:', {
    hasLeftCanvas: !!leftCanvas,
    hasRightCanvas: !!rightCanvas,
    hasDiffCanvas: !!diffCanvas.value,
    leftCanvasSize: leftCanvas ? `${leftCanvas.width}x${leftCanvas.height}` : 'N/A',
    rightCanvasSize: rightCanvas ? `${rightCanvas.width}x${rightCanvas.height}` : 'N/A',
  })

  if (!leftCanvas || !rightCanvas || !diffCanvas.value) {
    logger.error('Canvas elements not ready:', {
      leftCanvas: !!leftCanvas,
      rightCanvas: !!rightCanvas,
      diffCanvas: !!diffCanvas.value,
    })
    return
  }

  // Stop animation before recomputing
  stopAnimation()

  try {
    // Use async worker-based comparison to prevent UI freezing
    const result = await comparePdfsAsync(
      leftCanvas,
      rightCanvas,
      diffCanvas.value,
      diffOptions.value
    )

    stats.value = {
      differenceCount: result.differenceCount,
      totalPixels: result.totalPixels,
      percentDiff: result.percentDiff,
    }

    // Store both image data arrays for animation
    diffImageData.value = result.diffData
    originalImageData.value = result.originalData
    canvasWidth.value = diffCanvas.value.width
    canvasHeight.value = diffCanvas.value.height

    // Update diff render zoom to match source zoom
    diffRenderZoom.value = sourceZoom.value

    logger.log('Comparison completed:', stats.value, 'at zoom:', sourceZoom.value)

    // Restart animation if it was enabled
    if (animationEnabled.value) {
      startAnimation()
    }
  } catch (err) {
    logger.error('Comparison failed:', err)
  }
}

// Auto-run comparison when both files become available
watch(canCompare, async (canNowCompare) => {
  if (canNowCompare) {
    logger.log('Both files available, waiting for canvases to be ready...')

    // Wait for next tick to ensure component updates
    await nextTick()

    // Poll for canvas readiness (max 10 attempts, 200ms each = 2 seconds)
    let attempts = 0
    const maxAttempts = 10

    const checkAndRun = () => {
      const leftReady = leftCanvasComponent.value?.isReady
      const rightReady = rightCanvasComponent.value?.isReady

      logger.log(`Canvas readiness check (attempt ${attempts + 1}/${maxAttempts}):`, {
        leftReady,
        rightReady,
      })

      if (leftReady && rightReady) {
        logger.log('Both canvases ready, running initial comparison...')
        runComparison()
        pollingTimeoutId.value = null
      } else if (attempts < maxAttempts) {
        attempts++
        // Clear previous timeout and set new one
        if (pollingTimeoutId.value) clearTimeout(pollingTimeoutId.value)
        pollingTimeoutId.value = setTimeout(checkAndRun, 200) as unknown as number
      } else {
        logger.error('Canvases not ready after', maxAttempts, 'attempts')
        pollingTimeoutId.value = null
      }
    }

    checkAndRun()
  }
})

// Re-run comparison when source zoom changes (after PDFs have been rendered)
watch(sourceZoom, async () => {
  if (canCompare.value) {
    logger.log('Source zoom changed, waiting for re-render before comparison...')

    // Wait for PDFs to re-render at new zoom level
    await nextTick()

    // Clear previous timeout to avoid race conditions
    if (zoomTimeoutId.value) clearTimeout(zoomTimeoutId.value)

    // Add a small delay to ensure rendering completes
    zoomTimeoutId.value = setTimeout(() => {
      runComparison()
      // Update diff render zoom to match source zoom
      diffRenderZoom.value = sourceZoom.value
      zoomTimeoutId.value = null
    }, 300) as unknown as number
  }
})

// Re-render diff view when zoom changes (debounced)
watch(debouncedDiffZoom, async (newZoom) => {
  if (!canCompare.value) return

  // Calculate zoom delta to decide if re-render is needed
  const currentZoom = diffRenderZoom.value
  const zoomDelta = Math.abs(newZoom - currentZoom) / currentZoom
  const absoluteDelta = Math.abs(newZoom - currentZoom)

  // Skip re-render for small zoom changes (use CSS scaling instead)
  // Only re-render if zoom changed by >25% OR absolute diff >50 points
  if (zoomDelta > 0.25 || absoluteDelta > 50) {
    logger.log(
      'Significant zoom change (',
      zoomDelta.toFixed(2),
      'Δ), re-rendering at',
      newZoom,
      '%'
    )
    await recomputeDiffAtZoom(newZoom)
  } else {
    logger.log(
      'Small zoom change (',
      zoomDelta.toFixed(2),
      'Δ), using CSS scale only (no re-render)'
    )
    // diffZoom updates but diffRenderZoom stays the same
    // This maintains CSS transform in diffCanvasStyle until next significant zoom
  }
})

// Watch animation enabled state
watch(animationEnabled, (enabled) => {
  if (enabled) {
    startAnimation()
  } else {
    stopAnimation()
  }
})

// Watch animation speed changes
watch(animationSpeed, () => {
  if (animationEnabled.value) {
    // Restart animation with new speed
    startAnimation()
  }
})

// Clean up timeouts and animation when component unmounts (prevent memory leaks)
onBeforeUnmount(() => {
  if (pollingTimeoutId.value) {
    clearTimeout(pollingTimeoutId.value)
    pollingTimeoutId.value = null
  }
  if (zoomTimeoutId.value) {
    clearTimeout(zoomTimeoutId.value)
    zoomTimeoutId.value = null
  }
  // Stop animation on unmount
  stopAnimation()
})
</script>

<style scoped>
.canvas-wrapper {
  display: block;
  min-height: 200px;
  overflow: auto;
}

.canvas-wrapper canvas {
  display: block;
}
</style>
