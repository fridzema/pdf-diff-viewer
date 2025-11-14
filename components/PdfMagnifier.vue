<template>
  <div
    ref="containerRef"
    class="magnifier-container"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Slot for canvas content -->
    <slot></slot>

    <!-- Magnifier overlay (only visible when active and mouse is over container) -->
    <div v-if="isActive && isHovering" :style="magnifierStyle">
      <canvas ref="magnifierCanvasElement" :style="{ display: 'block' }"></canvas>
    </div>

    <!-- Magnifier controls (optional) -->
    <div v-if="showControls && isActive" class="magnifier-controls">
      <div class="control-group">
        <label class="control-label">Zoom: {{ magnification }}x</label>
        <input
          v-model.number="magnification"
          type="range"
          min="1.5"
          max="5"
          step="0.5"
          class="control-slider"
        />
      </div>
      <div class="control-group">
        <label class="control-label">Size: {{ size }}px</label>
        <input
          v-model.number="size"
          type="range"
          min="100"
          max="300"
          step="25"
          class="control-slider"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMagnifier } from '~/composables/useMagnifier'

const props = withDefaults(
  defineProps<{
    canvas?: HTMLCanvasElement | null
    magnification?: number
    size?: number
    borderColor?: string
    borderWidth?: number
    showControls?: boolean
    enabled?: boolean
  }>(),
  {
    canvas: null,
    magnification: 2,
    size: 200,
    borderColor: '#3b82f6',
    borderWidth: 3,
    showControls: false,
    enabled: false,
  }
)

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const magnifierCanvasElement = ref<HTMLCanvasElement | null>(null)
const isHovering = ref(false)

// Reactive magnifier settings
const magnification = ref(props.magnification)
const size = ref(props.size)

const {
  isActive,
  magnifierStyle,
  magnifierCanvas,
  handleMouseMove: handleMagnifierMouseMove,
  handleMouseEnter: handleMagnifierMouseEnter,
  handleMouseLeave: handleMagnifierMouseLeave,
  activate,
  deactivate,
} = useMagnifier(canvasRef, containerRef, {
  magnification: magnification.value,
  size: size.value,
  borderColor: props.borderColor,
  borderWidth: props.borderWidth,
})

// Sync magnifier canvas element with composable
watch(magnifierCanvas, (newCanvas) => {
  if (newCanvas && magnifierCanvasElement.value) {
    magnifierCanvasElement.value.width = newCanvas.width
    magnifierCanvasElement.value.height = newCanvas.height

    const ctx = magnifierCanvasElement.value.getContext('2d')
    const srcCtx = newCanvas.getContext('2d')
    if (ctx && srcCtx) {
      ctx.drawImage(newCanvas, 0, 0)
    }
  }
})

// Update canvas ref when prop changes
watch(
  () => props.canvas,
  (newCanvas) => {
    canvasRef.value = newCanvas
  },
  { immediate: true }
)

// Update magnification when prop or reactive value changes
watch([magnification, size], () => {
  // Re-initialize with new settings
  if (isActive.value) {
    deactivate()
    setTimeout(() => {
      activate()
    }, 10)
  }
})

// Activate/deactivate based on enabled prop
watch(
  () => props.enabled,
  (enabled) => {
    if (enabled) {
      activate()
    } else {
      deactivate()
    }
  },
  { immediate: true }
)

const handleMouseMove = (e: MouseEvent) => {
  handleMagnifierMouseMove(e)

  // Copy magnifier canvas content to element
  if (magnifierCanvas.value && magnifierCanvasElement.value) {
    const ctx = magnifierCanvasElement.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, magnifierCanvasElement.value.width, magnifierCanvasElement.value.height)
      ctx.drawImage(magnifierCanvas.value, 0, 0)
    }
  }
}

const handleMouseEnter = () => {
  isHovering.value = true
  handleMagnifierMouseEnter()
}

const handleMouseLeave = () => {
  isHovering.value = false
  handleMagnifierMouseLeave()
}

defineExpose({
  activate,
  deactivate,
  isActive,
})
</script>

<style scoped>
.magnifier-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.magnifier-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 1001;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  min-width: 200px;
}

.control-group {
  margin-bottom: 8px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

.control-slider {
  width: 100%;
  height: 4px;
  background-color: #4b5563;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background-color: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.control-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background-color: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
