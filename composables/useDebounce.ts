import { ref, watch, onUnmounted, readonly, type Ref } from 'vue'

/**
 * Composable for creating a debounced ref that delays updates
 * Useful for expensive operations like PDF rendering
 */
export function useDebouncedRef<T>(
  initialValue: T,
  delay: number = 300
): { debouncedValue: Ref<T>; immediateValue: Ref<T> } {
  const immediateValue = ref(initialValue) as Ref<T>
  const debouncedValue = ref(initialValue) as Ref<T>
  const timeout = ref<NodeJS.Timeout | null>(null)

  watch(immediateValue, (newValue) => {
    if (timeout.value) {
      clearTimeout(timeout.value)
    }

    timeout.value = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (timeout.value) {
      clearTimeout(timeout.value)
    }
  })

  return {
    immediateValue,
    debouncedValue,
  }
}

/**
 * Alternative: Watch an existing ref and return debounced version
 */
export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>
  const timeout = ref<NodeJS.Timeout | null>(null)

  watch(value, (newValue) => {
    if (timeout.value) {
      clearTimeout(timeout.value)
    }

    timeout.value = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (timeout.value) {
      clearTimeout(timeout.value)
    }
  })

  return readonly(debouncedValue) as Ref<T>
}
