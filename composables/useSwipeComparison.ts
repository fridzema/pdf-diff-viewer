import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SwipeOptions {
  initialPosition?: number // 0-100, percentage
  orientation?: 'vertical' | 'horizontal'
}

/**
 * Composable for swipe comparison functionality
 * Manages draggable divider position and mouse/touch interactions
 */
export function useSwipeComparison(
  containerRef: Ref<HTMLElement | null>,
  options: SwipeOptions = {}
) {
  const { initialPosition = 50, orientation = 'vertical' } = options

  // Divider position as percentage (0-100)
  const position = ref(initialPosition)
  const isDragging = ref(false)

  // Computed styles for the overlay and divider
  const overlayStyle = computed(() => {
    if (orientation === 'vertical') {
      return {
        clipPath: `inset(0 ${100 - position.value}% 0 0)`,
      }
    } else {
      return {
        clipPath: `inset(0 0 ${100 - position.value}% 0)`,
      }
    }
  })

  const dividerStyle = computed(() => {
    if (orientation === 'vertical') {
      return {
        left: `${position.value}%`,
        top: '0',
        bottom: '0',
        width: '4px',
        height: '100%',
        cursor: 'ew-resize',
      }
    } else {
      return {
        top: `${position.value}%`,
        left: '0',
        right: '0',
        height: '4px',
        width: '100%',
        cursor: 'ns-resize',
      }
    }
  })

  /**
   * Update position based on mouse/touch coordinates
   */
  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.value) return

    const rect = containerRef.value.getBoundingClientRect()

    if (orientation === 'vertical') {
      const relativeX = clientX - rect.left
      const percentage = (relativeX / rect.width) * 100
      position.value = Math.max(0, Math.min(100, percentage))
    } else {
      const relativeY = clientY - rect.top
      const percentage = (relativeY / rect.height) * 100
      position.value = Math.max(0, Math.min(100, percentage))
    }
  }

  /**
   * Handle mouse down on divider
   */
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  /**
   * Handle mouse move
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    e.preventDefault()
    updatePosition(e.clientX, e.clientY)
  }

  /**
   * Handle mouse up
   */
  const handleMouseUp = () => {
    isDragging.value = false
  }

  /**
   * Handle touch start
   */
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  /**
   * Handle touch move
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || e.touches.length === 0) return
    e.preventDefault()
    const touch = e.touches[0]
    updatePosition(touch.clientX, touch.clientY)
  }

  /**
   * Handle touch end
   */
  const handleTouchEnd = () => {
    isDragging.value = false
  }

  /**
   * Attach event listeners
   */
  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  })

  /**
   * Clean up event listeners
   */
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  })

  /**
   * Reset position to initial value
   */
  const reset = () => {
    position.value = initialPosition
  }

  return {
    position,
    isDragging,
    overlayStyle,
    dividerStyle,
    handleMouseDown,
    handleTouchStart,
    reset,
  }
}
