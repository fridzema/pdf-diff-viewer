<template>
  <div class="pdf-canvas-container">
    <!-- Title -->
    <div v-if="title" class="mb-3 text-sm font-semibold text-gray-700">
      {{ title }}
    </div>

    <!-- Zoom Controls Toolbar -->
    <div class="mb-3">
      <PdfViewerControls v-model="localZoom" />
    </div>

    <!-- Canvas Display -->
    <div
      ref="canvasWrapperRef"
      class="canvas-wrapper border border-gray-300 rounded-lg overflow-auto bg-gray-50"
    >
      <canvas ref="canvasRef" :style="canvasStyle"></canvas>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="mt-2 text-sm text-gray-600 flex items-center">
      <svg
        class="animate-spin h-4 w-4 mr-2 text-primary-600"
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
      Rendering PDF...
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-2 text-sm text-red-600">Error: {{ error }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  file: File | null
  title?: string
  zoom: number // Zoom level as percentage (e.g., 100)
}>()

const emit = defineEmits<{
  'update:zoom': [value: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLElement | null>(null)
const { renderPdfToCanvas, isLoading, error } = usePdfRenderer()

// Local zoom state that syncs with parent
const localZoom = computed({
  get: () => props.zoom,
  set: (value) => emit('update:zoom', value),
})

// Convert zoom percentage to scale (100% = 1.0, 150% = 1.5, etc.)
const immediateScale = computed(() => localZoom.value / 100)

// Debounce the scale value to prevent excessive re-renders during zoom
const debouncedScale = useDebounce(immediateScale, 300)

// Track if we're in debounce period (zooming but not yet re-rendering)
const isDebouncing = computed(() => immediateScale.value !== debouncedScale.value)

// Keyboard shortcuts for zoom
const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400, 500, 750, 1000]

useKeyboardShortcuts({
  onZoomIn: () => {
    const currentIndex = zoomLevels.indexOf(localZoom.value)
    if (currentIndex < zoomLevels.length - 1) {
      localZoom.value = zoomLevels[currentIndex + 1]
    }
  },
  onZoomOut: () => {
    const currentIndex = zoomLevels.indexOf(localZoom.value)
    if (currentIndex > 0) {
      localZoom.value = zoomLevels[currentIndex - 1]
    }
  },
  onZoomReset: () => {
    localZoom.value = 100
  },
})

// Mouse wheel zoom (Ctrl/Cmd + Wheel)
useWheelZoom(
  canvasWrapperRef,
  localZoom,
  (newZoom) => {
    localZoom.value = newZoom
  },
  { step: 10, min: 25, max: 1000 }
)

// CSS transform scale for immediate visual feedback during debounce
const canvasTransformScale = computed(() => {
  if (isDebouncing.value && debouncedScale.value > 0) {
    // Scale the already-rendered canvas to provide immediate visual feedback
    return immediateScale.value / debouncedScale.value
  }
  return 1
})

const canvasStyle = computed(() => ({
  transform: canvasTransformScale.value !== 1 ? `scale(${canvasTransformScale.value})` : 'none',
  transformOrigin: 'top left',
  transition: 'none', // No transition for instant feedback
}))

// Watch for file or zoom changes and render
// Use watchEffect to reactively track file, canvas, and DEBOUNCED zoom
watchEffect(async () => {
  const file = props.file
  const canvas = canvasRef.value
  const currentScale = debouncedScale.value // Use debounced value

  console.log('PdfCanvas watchEffect triggered:', {
    hasFile: !!file,
    hasCanvas: !!canvas,
    fileName: file?.name,
    zoom: localZoom.value,
    debouncedScale: currentScale,
    isDebouncing: isDebouncing.value,
  })

  if (file && canvas) {
    // Wait for next tick to ensure DOM is fully ready
    await nextTick()
    console.log('Attempting to render PDF to canvas at scale:', currentScale)

    try {
      await renderPdfToCanvas(file, canvas, currentScale)
    } catch (err) {
      console.error('Failed to render PDF in PdfCanvas:', err)
    }
  } else if (file && !canvas) {
    console.warn('File selected but canvas ref is not yet available')
  }
})

// Expose canvas element and wrapper to parent (as computed for reactive access)
const canvasElement = computed(() => canvasRef.value)
const canvasWrapper = computed(() => canvasWrapperRef.value)
const isCanvasReady = computed(() => !!canvasRef.value)

defineExpose({
  canvas: canvasElement,
  canvasWrapper: canvasWrapper,
  isReady: isCanvasReady,
})
</script>

<style scoped>
.canvas-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 200px;
  max-height: 800px;
}

canvas {
  display: block;
}
</style>
