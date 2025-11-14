<template>
  <div ref="containerRef" class="swipe-compare-container" :class="{ dragging: isDragging }">
    <!-- Base Canvas (PDF 1) -->
    <div class="canvas-layer base-layer">
      <canvas ref="canvas1Ref" :style="canvasStyle"></canvas>
    </div>

    <!-- Overlay Canvas (PDF 2) with clip-path -->
    <div class="canvas-layer overlay-layer" :style="overlayStyle">
      <canvas ref="canvas2Ref" :style="canvasStyle"></canvas>
    </div>

    <!-- Draggable Divider -->
    <div
      class="divider"
      :style="dividerStyle"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <!-- Divider handle (visual indicator) -->
      <div class="divider-handle">
        <svg
          v-if="orientation === 'vertical'"
          class="handle-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
        </svg>
        <svg
          v-else
          class="handle-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
      </div>
    </div>

    <!-- Position Label -->
    <div v-if="showLabel" class="position-label">{{ Math.round(position) }}%</div>
  </div>
</template>

<script setup lang="ts">
import { useSwipeComparison } from '~/composables/useSwipeComparison'

const props = withDefaults(
  defineProps<{
    canvas1?: HTMLCanvasElement | null
    canvas2?: HTMLCanvasElement | null
    orientation?: 'vertical' | 'horizontal'
    initialPosition?: number
    showLabel?: boolean
    zoom?: number
  }>(),
  {
    canvas1: null,
    canvas2: null,
    orientation: 'vertical',
    initialPosition: 50,
    showLabel: true,
    zoom: 100,
  }
)

const containerRef = ref<HTMLElement | null>(null)
const canvas1Ref = ref<HTMLCanvasElement | null>(null)
const canvas2Ref = ref<HTMLCanvasElement | null>(null)

const {
  position,
  isDragging,
  overlayStyle,
  dividerStyle,
  handleMouseDown,
  handleTouchStart,
  reset,
} = useSwipeComparison(containerRef, {
  initialPosition: props.initialPosition,
  orientation: props.orientation,
})

// Canvas styling with zoom support
const canvasStyle = computed(() => ({
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  transform: `scale(${props.zoom / 100})`,
  transformOrigin: 'top left',
}))

// Watch for canvas changes and copy them to our refs
watch(
  () => props.canvas1,
  (newCanvas) => {
    if (newCanvas && canvas1Ref.value) {
      const ctx = canvas1Ref.value.getContext('2d')
      if (ctx) {
        canvas1Ref.value.width = newCanvas.width
        canvas1Ref.value.height = newCanvas.height
        ctx.drawImage(newCanvas, 0, 0)
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.canvas2,
  (newCanvas) => {
    if (newCanvas && canvas2Ref.value) {
      const ctx = canvas2Ref.value.getContext('2d')
      if (ctx) {
        canvas2Ref.value.width = newCanvas.width
        canvas2Ref.value.height = newCanvas.height
        ctx.drawImage(newCanvas, 0, 0)
      }
    }
  },
  { immediate: true }
)

defineExpose({
  reset,
  position,
})
</script>

<style scoped>
.swipe-compare-container {
  position: relative;
  width: 100%;
  min-height: 400px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
}

.swipe-compare-container.dragging {
  cursor: grabbing !important;
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.base-layer {
  z-index: 1;
}

.overlay-layer {
  z-index: 2;
}

.divider {
  position: absolute;
  z-index: 3;
  background-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  transition: background-color 0.2s;
}

.divider:hover {
  background-color: #2563eb;
}

.swipe-compare-container.dragging .divider {
  background-color: #1d4ed8;
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.divider:hover .divider-handle {
  background-color: #2563eb;
  transform: translate(-50%, -50%) scale(1.1);
}

.swipe-compare-container.dragging .divider-handle {
  background-color: #1d4ed8;
  transform: translate(-50%, -50%) scale(1.15);
}

.handle-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.position-label {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 4;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}
</style>
