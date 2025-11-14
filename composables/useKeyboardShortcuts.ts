import { onMounted, onUnmounted } from 'vue'

/**
 * Composable for handling keyboard shortcuts for zoom control
 * Supports standard PDF viewer shortcuts: Ctrl/Cmd + Plus/Minus/0/9
 */
export interface KeyboardShortcutCallbacks {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void // Reset to 100%
  onZoomFit?: () => void // Fit to width
}

export function useKeyboardShortcuts(callbacks: KeyboardShortcutCallbacks) {
  const handleKeydown = (e: KeyboardEvent) => {
    // Check for modifier key (Ctrl on Windows/Linux, Cmd on Mac)
    const isMod = e.metaKey || e.ctrlKey

    if (!isMod) return

    // Zoom In: Ctrl/Cmd + Plus or Equals
    if ((e.key === '+' || e.key === '=') && callbacks.onZoomIn) {
      e.preventDefault()
      callbacks.onZoomIn()
      return
    }

    // Zoom Out: Ctrl/Cmd + Minus
    if (e.key === '-' && callbacks.onZoomOut) {
      e.preventDefault()
      callbacks.onZoomOut()
      return
    }

    // Reset Zoom: Ctrl/Cmd + 0
    if (e.key === '0' && callbacks.onZoomReset) {
      e.preventDefault()
      callbacks.onZoomReset()
      return
    }

    // Fit to Width: Ctrl/Cmd + 9
    if (e.key === '9' && callbacks.onZoomFit) {
      e.preventDefault()
      callbacks.onZoomFit()
      return
    }
  }

  // Add event listener on mount
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  // Remove event listener on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // Return the handler in case it needs to be managed externally
    handleKeydown,
  }
}
