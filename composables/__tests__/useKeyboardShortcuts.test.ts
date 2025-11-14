import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboardShortcuts, type KeyboardShortcutCallbacks } from '../useKeyboardShortcuts'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

describe('useKeyboardShortcuts', () => {
  let callbacks: KeyboardShortcutCallbacks

  beforeEach(() => {
    callbacks = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onZoomReset: vi.fn(),
      onZoomFit: vi.fn(),
    }
  })

  // Helper to mount component that uses the composable
  const mountComposable = (cbs: KeyboardShortcutCallbacks) => {
    const TestComponent = defineComponent({
      setup() {
        const _result = useKeyboardShortcuts(cbs)
        return () => h('div', 'test')
      },
    })

    return mount(TestComponent)
  }

  // Helper to trigger keyboard event
  const triggerKeydown = (key: string, options: { metaKey?: boolean; ctrlKey?: boolean } = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      metaKey: options.metaKey || false,
      ctrlKey: options.ctrlKey || false,
      bubbles: true,
      cancelable: true,
    })

    Object.defineProperty(event, 'preventDefault', {
      value: vi.fn(),
      writable: true,
    })

    window.dispatchEvent(event)
    return event
  }

  describe('zoom in shortcuts', () => {
    it('should call onZoomIn when Ctrl+Plus is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('+', { ctrlKey: true })

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1)
    })

    it('should call onZoomIn when Cmd+Plus is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('+', { metaKey: true })

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1)
    })

    it('should call onZoomIn when Ctrl+Equals is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('=', { ctrlKey: true })

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1)
    })

    it('should not call onZoomIn when Plus is pressed without modifier', () => {
      mountComposable(callbacks)

      triggerKeydown('+')

      expect(callbacks.onZoomIn).not.toHaveBeenCalled()
    })
  })

  describe('zoom out shortcuts', () => {
    it('should call onZoomOut when Ctrl+Minus is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('-', { ctrlKey: true })

      expect(callbacks.onZoomOut).toHaveBeenCalledTimes(1)
    })

    it('should call onZoomOut when Cmd+Minus is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('-', { metaKey: true })

      expect(callbacks.onZoomOut).toHaveBeenCalledTimes(1)
    })

    it('should not call onZoomOut when Minus is pressed without modifier', () => {
      mountComposable(callbacks)

      triggerKeydown('-')

      expect(callbacks.onZoomOut).not.toHaveBeenCalled()
    })
  })

  describe('zoom reset shortcuts', () => {
    it('should call onZoomReset when Ctrl+0 is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('0', { ctrlKey: true })

      expect(callbacks.onZoomReset).toHaveBeenCalledTimes(1)
    })

    it('should call onZoomReset when Cmd+0 is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('0', { metaKey: true })

      expect(callbacks.onZoomReset).toHaveBeenCalledTimes(1)
    })

    it('should not call onZoomReset when 0 is pressed without modifier', () => {
      mountComposable(callbacks)

      triggerKeydown('0')

      expect(callbacks.onZoomReset).not.toHaveBeenCalled()
    })
  })

  describe('zoom fit shortcuts', () => {
    it('should call onZoomFit when Ctrl+9 is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('9', { ctrlKey: true })

      expect(callbacks.onZoomFit).toHaveBeenCalledTimes(1)
    })

    it('should call onZoomFit when Cmd+9 is pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('9', { metaKey: true })

      expect(callbacks.onZoomFit).toHaveBeenCalledTimes(1)
    })

    it('should not call onZoomFit when 9 is pressed without modifier', () => {
      mountComposable(callbacks)

      triggerKeydown('9')

      expect(callbacks.onZoomFit).not.toHaveBeenCalled()
    })
  })

  describe('event prevention', () => {
    it('should prevent default for Ctrl+Plus', () => {
      mountComposable(callbacks)

      const event = triggerKeydown('+', { ctrlKey: true })

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent default for Ctrl+Minus', () => {
      mountComposable(callbacks)

      const event = triggerKeydown('-', { ctrlKey: true })

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent default for Ctrl+0', () => {
      mountComposable(callbacks)

      const event = triggerKeydown('0', { ctrlKey: true })

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should not prevent default for unhandled keys', () => {
      mountComposable(callbacks)

      const event = triggerKeydown('a', { ctrlKey: true })

      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('optional callbacks', () => {
    it('should work when onZoomIn is not provided', () => {
      const partialCallbacks = {
        onZoomOut: vi.fn(),
      }

      mountComposable(partialCallbacks)

      expect(() => triggerKeydown('+', { ctrlKey: true })).not.toThrow()
      expect(partialCallbacks.onZoomOut).not.toHaveBeenCalled()
    })

    it('should work when no callbacks are provided', () => {
      mountComposable({})

      expect(() => triggerKeydown('+', { ctrlKey: true })).not.toThrow()
    })

    it('should only call provided callbacks', () => {
      const partialCallbacks = {
        onZoomIn: vi.fn(),
      }

      mountComposable(partialCallbacks)

      triggerKeydown('+', { ctrlKey: true })
      expect(partialCallbacks.onZoomIn).toHaveBeenCalledTimes(1)

      // This should not throw even though onZoomOut is not provided
      triggerKeydown('-', { ctrlKey: true })
      expect(partialCallbacks.onZoomIn).toHaveBeenCalledTimes(1)
    })
  })

  describe('lifecycle', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      mountComposable(callbacks)

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const wrapper = mountComposable(callbacks)
      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should not respond to events after unmount', () => {
      const wrapper = mountComposable(callbacks)
      wrapper.unmount()

      triggerKeydown('+', { ctrlKey: true })

      expect(callbacks.onZoomIn).not.toHaveBeenCalled()
    })
  })

  describe('modifier key combinations', () => {
    it('should work with both Ctrl and Cmd pressed', () => {
      mountComposable(callbacks)

      triggerKeydown('+', { ctrlKey: true, metaKey: true })

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1)
    })

    it('should ignore other modifier keys alone', () => {
      mountComposable(callbacks)

      const event = new KeyboardEvent('keydown', {
        key: '+',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })

      window.dispatchEvent(event)

      expect(callbacks.onZoomIn).not.toHaveBeenCalled()
    })
  })

  describe('multiple shortcuts in sequence', () => {
    it('should handle multiple shortcuts correctly', () => {
      mountComposable(callbacks)

      triggerKeydown('+', { ctrlKey: true })
      triggerKeydown('+', { ctrlKey: true })
      triggerKeydown('-', { ctrlKey: true })
      triggerKeydown('0', { ctrlKey: true })

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(2)
      expect(callbacks.onZoomOut).toHaveBeenCalledTimes(1)
      expect(callbacks.onZoomReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('return value', () => {
    it('should return handleKeydown function', () => {
      const TestComponent = defineComponent({
        setup() {
          const result = useKeyboardShortcuts(callbacks)
          expect(result.handleKeydown).toBeDefined()
          expect(typeof result.handleKeydown).toBe('function')
          return () => h('div', 'test')
        },
      })

      mount(TestComponent)
    })
  })
})
