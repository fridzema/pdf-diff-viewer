/**
 * Composable for synchronizing scroll position between two elements
 * Useful for keeping two PDF viewers in sync when panning
 */
export function useScrollSync(
  element1: Ref<HTMLElement | null>,
  element2: Ref<HTMLElement | null>,
  options: { enabled?: Ref<boolean> } = {}
) {
  const enabled = options.enabled ?? ref(true)
  const syncing = ref(false)

  /**
   * Syncs scroll position from source to target with proportional scaling
   */
  const syncScroll = (source: HTMLElement, target: HTMLElement) => {
    if (syncing.value || !enabled.value) return

    syncing.value = true

    try {
      // Calculate proportional scaling if containers have different sizes
      const scaleX = source.scrollWidth > 0
        ? target.scrollWidth / source.scrollWidth
        : 1
      const scaleY = source.scrollHeight > 0
        ? target.scrollHeight / source.scrollHeight
        : 1

      // Apply scaled scroll position
      target.scrollLeft = Math.round(source.scrollLeft * scaleX)
      target.scrollTop = Math.round(source.scrollTop * scaleY)

    } finally {
      // Use requestAnimationFrame to prevent scroll fighting
      requestAnimationFrame(() => {
        syncing.value = false
      })
    }
  }

  // Scroll handlers
  let handleScroll1: ((e: Event) => void) | null = null
  let handleScroll2: ((e: Event) => void) | null = null

  // Setup scroll listeners
  watch(
    [element1, element2, enabled],
    ([el1, el2, isEnabled], [oldEl1, oldEl2]) => {
      // Clean up old listeners
      if (handleScroll1 && oldEl1) {
        oldEl1.removeEventListener('scroll', handleScroll1)
      }
      if (handleScroll2 && oldEl2) {
        oldEl2.removeEventListener('scroll', handleScroll2)
      }

      // Only add listeners if enabled
      if (!isEnabled || !el1 || !el2) {
        handleScroll1 = null
        handleScroll2 = null
        return
      }

      // Create new handlers
      handleScroll1 = () => {
        const source = element1.value
        const target = element2.value
        if (source && target) {
          syncScroll(source, target)
        }
      }

      handleScroll2 = () => {
        const source = element2.value
        const target = element1.value
        if (source && target) {
          syncScroll(source, target)
        }
      }

      // Add new listeners
      el1.addEventListener('scroll', handleScroll1, { passive: true })
      el2.addEventListener('scroll', handleScroll2, { passive: true })
    },
    { immediate: true }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    if (handleScroll1 && element1.value) {
      element1.value.removeEventListener('scroll', handleScroll1)
    }
    if (handleScroll2 && element2.value) {
      element2.value.removeEventListener('scroll', handleScroll2)
    }
  })

  return {
    enabled,
    syncing: readonly(syncing)
  }
}
