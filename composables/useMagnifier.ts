import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface MagnifierOptions {
  magnification?: number // Zoom level (2 = 2x, 3 = 3x, etc.)
  size?: number // Diameter of magnifier in pixels
  borderColor?: string
  borderWidth?: number
}

/**
 * Composable for magnifier/zoom lens functionality
 * Creates a circular magnified view that follows the cursor
 */
export function useMagnifier(
  canvasRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLElement | null>,
  options: MagnifierOptions = {}
) {
  const { magnification = 2, size = 200, borderColor = '#3b82f6', borderWidth = 3 } = options

  // Magnifier state
  const isActive = ref(false)
  const mouseX = ref(0)
  const mouseY = ref(0)
  const magnifierX = ref(0)
  const magnifierY = ref(0)

  // Magnifier canvas for rendering zoomed content
  const magnifierCanvas = ref<HTMLCanvasElement | null>(null)

  // RAF throttling for mousemove
  let rafId: number | null = null
  let pendingEvent: MouseEvent | null = null

  /**
   * Magnifier position style (centered on cursor)
   */
  const magnifierStyle = computed(() => ({
    position: 'absolute' as const,
    left: `${magnifierX.value}px`,
    top: `${magnifierY.value}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: `${borderWidth}px solid ${borderColor}`,
    pointerEvents: 'none' as const,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: 'translate(-50%, -50%)',
    overflow: 'hidden',
    backgroundColor: '#fff',
  }))

  /**
   * Update magnifier position and render magnified content
   */
  const updateMagnifier = (e: MouseEvent) => {
    if (!canvasRef.value || !containerRef.value || !magnifierCanvas.value) return

    const canvas = canvasRef.value
    const container = containerRef.value
    const rect = container.getBoundingClientRect()

    // Calculate mouse position relative to container
    mouseX.value = e.clientX - rect.left
    mouseY.value = e.clientY - rect.top

    // Position magnifier centered on cursor
    magnifierX.value = mouseX.value
    magnifierY.value = mouseY.value

    // Calculate source position on canvas accounting for scroll
    const scrollLeft = container.scrollLeft || 0
    const scrollTop = container.scrollTop || 0
    const canvasX = mouseX.value + scrollLeft
    const canvasY = mouseY.value + scrollTop

    // Source area to magnify (smaller area based on magnification level)
    const sourceSize = size / magnification
    const sourceX = canvasX - sourceSize / 2
    const sourceY = canvasY - sourceSize / 2

    // Render magnified content to magnifier canvas
    const dpr = window.devicePixelRatio || 1
    const ctx = magnifierCanvas.value.getContext('2d')
    if (ctx) {
      // Clear at high resolution
      ctx.clearRect(0, 0, size * dpr, size * dpr)

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Draw magnified portion at device pixel ratio resolution
      ctx.drawImage(canvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size * dpr, size * dpr)
    }
  }

  /**
   * Handle mouse move (throttled with requestAnimationFrame)
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isActive.value) return

    // Store the latest event
    pendingEvent = e

    // Only schedule a new frame if one isn't already pending
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (pendingEvent) {
          updateMagnifier(pendingEvent)
          pendingEvent = null
        }
        rafId = null
      })
    }
  }

  /**
   * Handle mouse enter (activate magnifier)
   */
  const handleMouseEnter = () => {
    if (isActive.value) {
      // Magnifier is already enabled globally, just show it
    }
  }

  /**
   * Handle mouse leave (hide magnifier)
   */
  const handleMouseLeave = () => {
    // Keep magnifier active but hide it when mouse leaves
  }

  /**
   * Initialize magnifier canvas
   */
  const initMagnifierCanvas = () => {
    const dpr = window.devicePixelRatio || 1

    magnifierCanvas.value = document.createElement('canvas')
    // Set canvas resolution to match device pixel ratio for sharp rendering
    magnifierCanvas.value.width = size * dpr
    magnifierCanvas.value.height = size * dpr
    // Set CSS size for correct display size
    magnifierCanvas.value.style.width = `${size}px`
    magnifierCanvas.value.style.height = `${size}px`
    magnifierCanvas.value.style.display = 'block'
  }

  /**
   * Activate magnifier
   */
  const activate = () => {
    isActive.value = true
    if (!magnifierCanvas.value) {
      initMagnifierCanvas()
    }
  }

  /**
   * Deactivate magnifier
   */
  const deactivate = () => {
    isActive.value = false
  }

  /**
   * Toggle magnifier
   */
  const toggle = () => {
    if (isActive.value) {
      deactivate()
    } else {
      activate()
    }
  }

  /**
   * Attach event listeners
   */
  onMounted(() => {
    initMagnifierCanvas()
  })

  /**
   * Clean up
   */
  onUnmounted(() => {
    // Cancel any pending RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    pendingEvent = null
    magnifierCanvas.value = null
  })

  return {
    isActive,
    magnifierStyle,
    magnifierCanvas,
    magnifierX,
    magnifierY,
    mouseX,
    mouseY,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    activate,
    deactivate,
    toggle,
  }
}
