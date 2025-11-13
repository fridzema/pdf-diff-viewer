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
    <div class="canvas-wrapper border border-gray-300 rounded-lg overflow-auto bg-gray-50">
      <canvas ref="canvasRef"></canvas>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="mt-2 text-sm text-gray-600 flex items-center">
      <svg class="animate-spin h-4 w-4 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Rendering PDF...
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-2 text-sm text-red-600">
      Error: {{ error }}
    </div>
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
const { renderPdfToCanvas, isLoading, error } = usePdfRenderer()

// Local zoom state that syncs with parent
const localZoom = computed({
  get: () => props.zoom,
  set: (value) => emit('update:zoom', value)
})

// Convert zoom percentage to scale (100% = 1.0, 150% = 1.5, etc.)
const scale = computed(() => localZoom.value / 100)

// Watch for file or zoom changes and render
// Use watchEffect to reactively track file, canvas, and zoom
watchEffect(async () => {
  const file = props.file
  const canvas = canvasRef.value
  const currentScale = scale.value

  console.log('PdfCanvas watchEffect triggered:', {
    hasFile: !!file,
    hasCanvas: !!canvas,
    fileName: file?.name,
    zoom: localZoom.value,
    scale: currentScale
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

// Expose canvas element to parent (as computed for reactive access)
const canvasElement = computed(() => canvasRef.value)
const isCanvasReady = computed(() => !!canvasRef.value)

defineExpose({
  canvas: canvasElement,
  isReady: isCanvasReady
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
