<template>
  <div class="pdf-canvas-container">
    <div v-if="title" class="mb-2 text-sm font-semibold text-gray-700">
      {{ title }}
    </div>
    <div class="canvas-wrapper border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
      <canvas ref="canvasRef" class="max-w-full h-auto"></canvas>
    </div>
    <div v-if="isLoading" class="mt-2 text-sm text-gray-600 flex items-center">
      <svg class="animate-spin h-4 w-4 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Rendering PDF...
    </div>
    <div v-if="error" class="mt-2 text-sm text-red-600">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  file: File | null
  title?: string
  scale?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { renderPdfToCanvas, isLoading, error } = usePdfRenderer()

// Watch for file changes and render
// Use watchEffect to reactively track both file and canvas availability
watchEffect(async () => {
  const file = props.file
  const canvas = canvasRef.value

  console.log('PdfCanvas watchEffect triggered:', {
    hasFile: !!file,
    hasCanvas: !!canvas,
    fileName: file?.name
  })

  if (file && canvas) {
    // Wait for next tick to ensure DOM is fully ready
    await nextTick()
    console.log('Attempting to render PDF to canvas...')

    try {
      await renderPdfToCanvas(file, canvas, props.scale || 1.5)
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
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
