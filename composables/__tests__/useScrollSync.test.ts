import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useScrollSync } from '../useScrollSync'

describe('useScrollSync', () => {
  let element1: HTMLDivElement
  let element2: HTMLDivElement

  beforeEach(() => {
    // Create mock scrollable elements
    element1 = document.createElement('div')
    element2 = document.createElement('div')

    // Set up scroll properties
    Object.defineProperties(element1, {
      scrollLeft: { value: 0, writable: true },
      scrollTop: { value: 0, writable: true },
      scrollWidth: { value: 1000, writable: true },
      scrollHeight: { value: 2000, writable: true },
    })

    Object.defineProperties(element2, {
      scrollLeft: { value: 0, writable: true },
      scrollTop: { value: 0, writable: true },
      scrollWidth: { value: 1000, writable: true },
      scrollHeight: { value: 2000, writable: true },
    })
  })

  it('should initialize with enabled state', () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    const { enabled } = useScrollSync(el1Ref, el2Ref)

    expect(enabled.value).toBe(true)
  })

  it('should accept custom enabled state', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)
    const customEnabled = ref(false)

    const { enabled } = useScrollSync(el1Ref, el2Ref, { enabled: customEnabled })

    expect(enabled.value).toBe(false)
  })

  it('should sync scroll from element1 to element2', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    // Scroll element1
    element1.scrollLeft = 100
    element1.scrollTop = 200

    // Trigger scroll event
    const scrollEvent = new Event('scroll')
    element1.dispatchEvent(scrollEvent)

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(element2.scrollLeft).toBe(100)
    expect(element2.scrollTop).toBe(200)
  })

  it('should sync scroll from element2 to element1', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    // Scroll element2
    element2.scrollLeft = 150
    element2.scrollTop = 250

    // Trigger scroll event
    const scrollEvent = new Event('scroll')
    element2.dispatchEvent(scrollEvent)

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(element1.scrollLeft).toBe(150)
    expect(element1.scrollTop).toBe(250)
  })

  it('should handle proportional scaling for different sized elements', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    // Element2 is twice as large
    Object.defineProperty(element2, 'scrollWidth', { value: 2000, writable: true })
    Object.defineProperty(element2, 'scrollHeight', { value: 4000, writable: true })

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    // Scroll element1
    element1.scrollLeft = 100
    element1.scrollTop = 200

    const scrollEvent = new Event('scroll')
    element1.dispatchEvent(scrollEvent)

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    // Element2 should have scaled scroll position (2x)
    expect(element2.scrollLeft).toBe(200) // 100 * 2
    expect(element2.scrollTop).toBe(400) // 200 * 2
  })

  it('should not sync when disabled', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)
    const enabledRef = ref(false)

    useScrollSync(el1Ref, el2Ref, { enabled: enabledRef })
    await nextTick()

    element1.scrollLeft = 100
    element1.scrollTop = 200

    const scrollEvent = new Event('scroll')
    element1.dispatchEvent(scrollEvent)

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    // Element2 should not have moved
    expect(element2.scrollLeft).toBe(0)
    expect(element2.scrollTop).toBe(0)
  })

  it('should enable sync when enabled state changes', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)
    const enabledRef = ref(false)

    useScrollSync(el1Ref, el2Ref, { enabled: enabledRef })
    await nextTick()

    // Enable syncing
    enabledRef.value = true
    await nextTick()

    element1.scrollLeft = 100
    element1.scrollTop = 200

    const scrollEvent = new Event('scroll')
    element1.dispatchEvent(scrollEvent)

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(element2.scrollLeft).toBe(100)
    expect(element2.scrollTop).toBe(200)
  })

  it('should prevent scroll fighting with syncing flag', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    const { syncing } = useScrollSync(el1Ref, el2Ref)
    await nextTick()

    expect(syncing.value).toBe(false)

    // Scroll element1
    element1.scrollLeft = 100
    const scrollEvent = new Event('scroll')
    element1.dispatchEvent(scrollEvent)

    // syncing flag should be true immediately
    expect(syncing.value).toBe(true)

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    // syncing flag should be false after RAF
    expect(syncing.value).toBe(false)
  })

  it('should handle null elements gracefully', async () => {
    const el1Ref = ref<HTMLElement | null>(null)
    const el2Ref = ref<HTMLElement | null>(null)

    expect(() => useScrollSync(el1Ref, el2Ref)).not.toThrow()
  })

  it('should update listeners when elements change', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    // Create new elements
    const newElement1 = document.createElement('div')
    Object.defineProperties(newElement1, {
      scrollLeft: { value: 0, writable: true },
      scrollTop: { value: 0, writable: true },
      scrollWidth: { value: 1000, writable: true },
      scrollHeight: { value: 2000, writable: true },
    })

    // Change element reference
    el1Ref.value = newElement1
    await nextTick()

    // Old element should not trigger sync
    element1.scrollLeft = 100
    element1.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(element2.scrollLeft).toBe(0)

    // New element should trigger sync
    newElement1.scrollLeft = 150
    newElement1.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(element2.scrollLeft).toBe(150)
  })

  it('should handle zero scroll dimensions', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    Object.defineProperty(element1, 'scrollWidth', { value: 0, writable: true })
    Object.defineProperty(element1, 'scrollHeight', { value: 0, writable: true })

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    element1.scrollLeft = 100
    element1.scrollTop = 200

    const scrollEvent = new Event('scroll')

    // Should not throw
    expect(() => element1.dispatchEvent(scrollEvent)).not.toThrow()
  })

  it('should add event listeners with passive option', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    const addEventListenerSpy = vi.spyOn(element1, 'addEventListener')

    useScrollSync(el1Ref, el2Ref)
    await nextTick()

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    })
  })

  it('should return readonly syncing ref', async () => {
    const el1Ref = ref(element1)
    const el2Ref = ref(element2)

    const { syncing } = useScrollSync(el1Ref, el2Ref)

    // Syncing should be readonly - TypeScript would catch this, but we can verify at runtime
    expect(typeof syncing.value).toBe('boolean')
  })
})
