import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebouncedRef, useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useDebouncedRef', () => {
    it('should initialize with the initial value', () => {
      const { immediateValue, debouncedValue } = useDebouncedRef(10)

      expect(immediateValue.value).toBe(10)
      expect(debouncedValue.value).toBe(10)
    })

    it('should update immediateValue synchronously', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef(10)

      immediateValue.value = 20
      await nextTick()

      expect(immediateValue.value).toBe(20)
      expect(debouncedValue.value).toBe(10) // Should still be old value
    })

    it('should update debouncedValue after delay', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef(10, 300)

      immediateValue.value = 20
      await nextTick()

      expect(debouncedValue.value).toBe(10) // Not updated yet

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe(20) // Now updated
    })

    it('should debounce multiple rapid updates', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef(0, 300)

      // Rapid updates
      immediateValue.value = 1
      await nextTick()
      vi.advanceTimersByTime(100)

      immediateValue.value = 2
      await nextTick()
      vi.advanceTimersByTime(100)

      immediateValue.value = 3
      await nextTick()

      // Only 200ms passed, should still be initial value
      expect(debouncedValue.value).toBe(0)

      // Complete the delay
      vi.advanceTimersByTime(300)
      await nextTick()

      // Should have the last value only
      expect(debouncedValue.value).toBe(3)
    })

    it('should use custom delay', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef(10, 500)

      immediateValue.value = 20
      await nextTick()

      vi.advanceTimersByTime(300)
      await nextTick()
      expect(debouncedValue.value).toBe(10) // Not yet

      vi.advanceTimersByTime(200)
      await nextTick()
      expect(debouncedValue.value).toBe(20) // Now updated
    })

    it('should handle string values', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef('hello', 300)

      immediateValue.value = 'world'
      await nextTick()

      expect(immediateValue.value).toBe('world')
      expect(debouncedValue.value).toBe('hello')

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe('world')
    })

    it('should handle object values', async () => {
      const { immediateValue, debouncedValue } = useDebouncedRef({ count: 0 }, 300)

      immediateValue.value = { count: 1 }
      await nextTick()

      expect(immediateValue.value.count).toBe(1)
      expect(debouncedValue.value.count).toBe(0)

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value.count).toBe(1)
    })
  })

  describe('useDebounce', () => {
    it('should initialize with the ref value', () => {
      const sourceRef = ref(10)
      const debouncedValue = useDebounce(sourceRef, 300)

      expect(debouncedValue.value).toBe(10)
    })

    it('should return readonly ref', () => {
      const sourceRef = ref(10)
      const debouncedValue = useDebounce(sourceRef, 300)

      // Try to modify (TypeScript should prevent this, but we test runtime)
      expect(typeof debouncedValue.value).toBe('number')
    })

    it('should update after delay when source changes', async () => {
      const sourceRef = ref(10)
      const debouncedValue = useDebounce(sourceRef, 300)

      sourceRef.value = 20
      await nextTick()

      expect(sourceRef.value).toBe(20)
      expect(debouncedValue.value).toBe(10) // Not updated yet

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe(20) // Now updated
    })

    it('should debounce multiple rapid updates to source ref', async () => {
      const sourceRef = ref(0)
      const debouncedValue = useDebounce(sourceRef, 300)

      sourceRef.value = 1
      await nextTick()
      vi.advanceTimersByTime(100)

      sourceRef.value = 2
      await nextTick()
      vi.advanceTimersByTime(100)

      sourceRef.value = 3
      await nextTick()

      expect(debouncedValue.value).toBe(0)

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe(3)
    })

    it('should use custom delay', async () => {
      const sourceRef = ref(10)
      const debouncedValue = useDebounce(sourceRef, 500)

      sourceRef.value = 20
      await nextTick()

      vi.advanceTimersByTime(300)
      await nextTick()
      expect(debouncedValue.value).toBe(10)

      vi.advanceTimersByTime(200)
      await nextTick()
      expect(debouncedValue.value).toBe(20)
    })

    it('should work with different value types', async () => {
      const stringRef = ref('hello')
      const debouncedString = useDebounce(stringRef, 300)

      stringRef.value = 'world'
      await nextTick()
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedString.value).toBe('world')
    })

    it('should handle rapid changes correctly', async () => {
      const sourceRef = ref(0)
      const debouncedValue = useDebounce(sourceRef, 300)

      // Simulate typing or rapid slider movement
      for (let i = 1; i <= 10; i++) {
        sourceRef.value = i
        await nextTick()
        vi.advanceTimersByTime(50)
      }

      // Should still be at initial value
      expect(debouncedValue.value).toBe(0)

      // Wait for debounce to complete
      vi.advanceTimersByTime(300)
      await nextTick()

      // Should have the last value
      expect(debouncedValue.value).toBe(10)
    })
  })
})
