import { watch, onUnmounted, type Ref } from 'vue'

/**
 * Composable for handling mouse wheel zoom (Ctrl/Cmd + Wheel)
 * Standard behavior in PDF viewers and image editors
 */
export interface WheelZoomOptions {
  step?: number // Zoom step in percentage (default: 10)
  min?: number // Minimum zoom percentage (default: 25)
  max?: number // Maximum zoom percentage (default: 1000)
}

export function useWheelZoom(
  element: Ref<HTMLElement | null>,
  currentZoom: Ref<number>,
  onZoomChange: (newZoom: number) => void,
  options: WheelZoomOptions = {}
) {
  const step = options.step ?? 10
  const min = options.min ?? 25
  const max = options.max ?? 1000

  const handleWheel = (e: WheelEvent) => {
    // Only zoom if Ctrl or Cmd is pressed
    if (!(e.metaKey || e.ctrlKey)) return

    // Prevent default zoom behavior and page scroll
    e.preventDefault()

    // Calculate zoom direction (deltaY > 0 = zoom out, < 0 = zoom in)
    const delta = e.deltaY > 0 ? -step : step
    const newZoom = Math.max(min, Math.min(max, currentZoom.value + delta))

    // Only update if zoom actually changed
    if (newZoom !== currentZoom.value) {
      onZoomChange(newZoom)
    }
  }

  // Watch for element changes and manage event listeners
  watch(
    element,
    (el, oldEl) => {
      // Remove listener from old element
      if (oldEl) {
        oldEl.removeEventListener('wheel', handleWheel)
      }

      // Add listener to new element
      // passive: false is required to allow preventDefault()
      if (el) {
        el.addEventListener('wheel', handleWheel, { passive: false })
      }
    },
    { immediate: true }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    if (element.value) {
      element.value.removeEventListener('wheel', handleWheel)
    }
  })

  return {
    handleWheel,
  }
}
