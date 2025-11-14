import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useWheelZoom } from '../useWheelZoom'

describe('useWheelZoom', () => {
  let element: HTMLDivElement
  let currentZoom: ReturnType<typeof ref<number>>
  let onZoomChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    element = document.createElement('div')
    currentZoom = ref(100)
    onZoomChange = vi.fn((newZoom: number) => {
      currentZoom.value = newZoom
    })
  })

  // Helper to create wheel event
  const createWheelEvent = (
    deltaY: number,
    options: { metaKey?: boolean; ctrlKey?: boolean } = {}
  ): WheelEvent => {
    const event = new WheelEvent('wheel', {
      deltaY,
      metaKey: options.metaKey || false,
      ctrlKey: options.ctrlKey || false,
      bubbles: true,
      cancelable: true,
    })

    Object.defineProperty(event, 'preventDefault', {
      value: vi.fn(),
      writable: true,
    })

    return event
  }

  describe('basic functionality', () => {
    it('should zoom in when scrolling up with Ctrl', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110) // 100 + 10 (default step)
    })

    it('should zoom out when scrolling down with Ctrl', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(90) // 100 - 10 (default step)
    })

    it('should zoom in when scrolling up with Cmd', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { metaKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110)
    })

    it('should not zoom without modifier key', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100)
      element.dispatchEvent(event)

      expect(onZoomChange).not.toHaveBeenCalled()
    })
  })

  describe('zoom limits', () => {
    it('should respect minimum zoom limit (default 25%)', async () => {
      currentZoom.value = 30
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(100, { ctrlKey: true }) // Zoom out
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(25) // Clamped to min
    })

    it('should respect maximum zoom limit (default 1000%)', async () => {
      currentZoom.value = 995
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true }) // Zoom in
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(1000) // Clamped to max
    })

    it('should not call onZoomChange when already at minimum', async () => {
      currentZoom.value = 25
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(100, { ctrlKey: true }) // Try to zoom out
      element.dispatchEvent(event)

      expect(onZoomChange).not.toHaveBeenCalled()
    })

    it('should not call onZoomChange when already at maximum', async () => {
      currentZoom.value = 1000
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true }) // Try to zoom in
      element.dispatchEvent(event)

      expect(onZoomChange).not.toHaveBeenCalled()
    })
  })

  describe('custom options', () => {
    it('should use custom step', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange, { step: 25 })
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(125) // 100 + 25
    })

    it('should use custom minimum', async () => {
      currentZoom.value = 60
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange, { min: 50 })
      await nextTick()

      const event = createWheelEvent(100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(50) // Clamped to custom min
    })

    it('should use custom maximum', async () => {
      currentZoom.value = 490
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange, { max: 500 })
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(500) // Clamped to custom max
    })

    it('should use all custom options together', async () => {
      currentZoom.value = 100
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange, {
        step: 5,
        min: 10,
        max: 200,
      })
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(105) // 100 + 5
    })
  })

  describe('event prevention', () => {
    it('should prevent default when zooming with Ctrl', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent default when zooming with Cmd', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { metaKey: true })
      element.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should not prevent default without modifier key', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100)
      element.dispatchEvent(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('element lifecycle', () => {
    it('should handle null element', async () => {
      const elementRef = ref<HTMLElement | null>(null)
      expect(() => useWheelZoom(elementRef, currentZoom, onZoomChange)).not.toThrow()
    })

    it('should update listener when element changes', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const newElement = document.createElement('div')
      elementRef.value = newElement
      await nextTick()

      // Old element should not trigger zoom
      const event1 = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event1)
      expect(onZoomChange).not.toHaveBeenCalled()

      // New element should trigger zoom
      const event2 = createWheelEvent(-100, { ctrlKey: true })
      newElement.dispatchEvent(event2)
      expect(onZoomChange).toHaveBeenCalledWith(110)
    })

    it('should remove listener from old element when element changes', async () => {
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const newElement = document.createElement('div')
      elementRef.value = newElement
      await nextTick()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function))
    })

    it('should add listener with passive: false', async () => {
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener')
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      })
    })
  })

  describe('zoom direction', () => {
    it('should zoom in for negative deltaY', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-50, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110)
    })

    it('should zoom out for positive deltaY', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(50, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(90)
    })

    it('should handle very small deltaY values', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-1, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110) // Still uses step size
    })

    it('should handle very large deltaY values', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-1000, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110) // Still uses step size
    })
  })

  describe('multiple wheel events', () => {
    it('should handle rapid wheel events', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      // Simulate rapid scrolling
      for (let i = 0; i < 5; i++) {
        const event = createWheelEvent(-100, { ctrlKey: true })
        element.dispatchEvent(event)
        currentZoom.value = 100 + (i + 1) * 10 // Simulate zoom change
      }

      expect(onZoomChange).toHaveBeenCalledTimes(5)
    })
  })

  describe('modifier key combinations', () => {
    it('should work with both Ctrl and Cmd pressed', async () => {
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true, metaKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110)
    })
  })

  describe('return value', () => {
    it('should return handleWheel function', async () => {
      const elementRef = ref(element)
      const result = useWheelZoom(elementRef, currentZoom, onZoomChange)

      expect(result.handleWheel).toBeDefined()
      expect(typeof result.handleWheel).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('should handle zoom at exactly minimum after zoom out', async () => {
      currentZoom.value = 35
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(25)
      expect(onZoomChange).toHaveBeenCalledTimes(1)
    })

    it('should handle fractional zoom values', async () => {
      currentZoom.value = 100.5
      const elementRef = ref(element)
      useWheelZoom(elementRef, currentZoom, onZoomChange)
      await nextTick()

      const event = createWheelEvent(-100, { ctrlKey: true })
      element.dispatchEvent(event)

      expect(onZoomChange).toHaveBeenCalledWith(110.5)
    })
  })
})
