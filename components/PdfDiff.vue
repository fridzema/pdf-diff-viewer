<template>
  <div class="pdf-diff-container">
    <!-- Control Panel -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Comparison Settings</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Diff Mode Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Comparison Mode
          </label>
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
          <label class="ml-2 text-sm text-gray-700">
            Convert to grayscale before comparing
          </label>
        </div>
      </div>

      <!-- Comparison Button -->
      <div class="mt-6">
        <button
          @click="runComparison"
          :disabled="!canCompare"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Run Comparison
        </button>
      </div>

      <!-- Stats Display -->
      <div v-if="stats" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Comparison Results</h3>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Different Pixels:</span>
            <span class="font-semibold text-gray-900 ml-2">{{ stats.differenceCount.toLocaleString() }}</span>
          </div>
          <div>
            <span class="text-gray-600">Total Pixels:</span>
            <span class="font-semibold text-gray-900 ml-2">{{ stats.totalPixels.toLocaleString() }}</span>
          </div>
          <div>
            <span class="text-gray-600">Difference:</span>
            <span class="font-semibold ml-2"
                  :class="stats.percentDiff > 5 ? 'text-red-600' : 'text-green-600'">
              {{ stats.percentDiff.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Canvas Display - 2 Row Layout -->
    <div class="space-y-6">
      <!-- Row 1: Source PDFs Side-by-Side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left PDF -->
        <div>
          <PdfCanvas
            ref="leftCanvasComponent"
            :file="leftFile"
            title="PDF 1"
            v-model:zoom="sourceZoom"
          />
        </div>

        <!-- Right PDF -->
        <div>
          <PdfCanvas
            ref="rightCanvasComponent"
            :file="rightFile"
            title="PDF 2"
            v-model:zoom="sourceZoom"
          />
        </div>
      </div>

      <!-- Row 2: Difference View Full Width -->
      <div>
        <div class="mb-3 text-sm font-semibold text-gray-700">Difference View</div>

        <!-- Zoom Controls for Diff View -->
        <div class="mb-3">
          <PdfViewerControls v-model="diffZoom" />
        </div>

        <!-- Diff Canvas -->
        <div class="canvas-wrapper border border-gray-300 rounded-lg overflow-auto bg-gray-50">
          <canvas
            ref="diffCanvas"
            class="max-w-full h-auto"
            :style="{ transform: `scale(${diffZoom / 100})`, transformOrigin: 'top left' }"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiffMode, DiffOptions } from '~/composables/usePdfDiff'

const props = defineProps<{
  leftFile: File | null
  rightFile: File | null
}>()

const leftCanvasComponent = ref<any>(null)
const rightCanvasComponent = ref<any>(null)
const diffCanvas = ref<HTMLCanvasElement | null>(null)

const { comparePdfs } = usePdfDiff()

// Zoom state management
const sourceZoom = ref(100) // Synced zoom for both source PDFs (100% = 1.0 scale)
const diffZoom = ref(100)   // Independent zoom for difference view

const diffOptions = ref<DiffOptions>({
  mode: 'pixel',
  threshold: 10,
  overlayOpacity: 0.5,
  useGrayscale: false
})

const stats = ref<{
  differenceCount: number
  totalPixels: number
  percentDiff: number
} | null>(null)

const canCompare = computed(() => {
  return props.leftFile !== null && props.rightFile !== null
})

const getModeDescription = (mode: DiffMode): string => {
  const descriptions: Record<DiffMode, string> = {
    pixel: 'Highlights all different pixels in red',
    threshold: 'Only highlights pixels that differ by more than the threshold',
    grayscale: 'Converts to grayscale before comparing',
    overlay: 'Blends both PDFs with red highlights for differences',
    heatmap: 'Shows difference intensity with color gradient (blue → red)'
  }
  return descriptions[mode]
}

const runComparison = () => {
  if (!canCompare.value) return

  // Access the canvas element (already unwrapped via computed)
  const leftCanvas = leftCanvasComponent.value?.canvas
  const rightCanvas = rightCanvasComponent.value?.canvas

  console.log('Running comparison with canvases:', {
    hasLeftCanvas: !!leftCanvas,
    hasRightCanvas: !!rightCanvas,
    hasDiffCanvas: !!diffCanvas.value,
    leftCanvasSize: leftCanvas ? `${leftCanvas.width}x${leftCanvas.height}` : 'N/A',
    rightCanvasSize: rightCanvas ? `${rightCanvas.width}x${rightCanvas.height}` : 'N/A'
  })

  if (!leftCanvas || !rightCanvas || !diffCanvas.value) {
    console.error('Canvas elements not ready:', {
      leftCanvas: !!leftCanvas,
      rightCanvas: !!rightCanvas,
      diffCanvas: !!diffCanvas.value
    })
    return
  }

  try {
    stats.value = comparePdfs(
      leftCanvas,
      rightCanvas,
      diffCanvas.value,
      diffOptions.value
    )
    console.log('Comparison completed:', stats.value)
  } catch (err) {
    console.error('Comparison failed:', err)
  }
}

// Auto-run comparison when files change and canvases are ready
watch([() => props.leftFile, () => props.rightFile], async () => {
  if (canCompare.value) {
    console.log('Files changed, waiting for canvases to be ready...')

    // Wait for next tick to ensure component updates
    await nextTick()

    // Poll for canvas readiness (max 10 attempts, 200ms each = 2 seconds)
    let attempts = 0
    const maxAttempts = 10

    const checkAndRun = () => {
      const leftReady = leftCanvasComponent.value?.isReady
      const rightReady = rightCanvasComponent.value?.isReady

      console.log(`Canvas readiness check (attempt ${attempts + 1}/${maxAttempts}):`, {
        leftReady,
        rightReady
      })

      if (leftReady && rightReady) {
        console.log('Both canvases ready, running comparison...')
        runComparison()
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(checkAndRun, 200)
      } else {
        console.error('Canvases not ready after', maxAttempts, 'attempts')
      }
    }

    checkAndRun()
  }
})

// Re-run comparison when source zoom changes (after PDFs have been rendered)
watch(sourceZoom, async () => {
  if (canCompare.value) {
    console.log('Source zoom changed, waiting for re-render before comparison...')

    // Wait for PDFs to re-render at new zoom level
    await nextTick()

    // Add a small delay to ensure rendering completes
    setTimeout(() => {
      runComparison()
    }, 300)
  }
})

// diffZoom only affects the CSS scale of the diff canvas, no need to re-run comparison
</script>

<style scoped>
.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
