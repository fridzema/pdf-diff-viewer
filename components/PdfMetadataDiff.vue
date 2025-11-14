<template>
  <div class="metadata-diff-container">
    <!-- Header with Controls -->
    <div class="controls-bar flex flex-wrap gap-3 mb-4">
      <!-- Search Input -->
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search metadata fields..."
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Filter Toggle -->
      <label
        class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer"
      >
        <input
          v-model="showOnlyDifferences"
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Show only differences</span>
      </label>
    </div>

    <!-- Statistics -->
    <div
      v-if="comparison"
      class="stats-bar flex flex-wrap gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400"
    >
      <div class="stat"><span class="font-semibold">Total fields:</span> {{ totalFields }}</div>
      <div
        v-if="comparison.differences.length > 0"
        class="stat text-yellow-600 dark:text-yellow-400"
      >
        <span class="font-semibold">Changed:</span> {{ comparison.changed.length }}
      </div>
      <div v-if="comparison.leftOnly.length > 0" class="stat text-red-600 dark:text-red-400">
        <span class="font-semibold">Only in PDF 1:</span> {{ comparison.leftOnly.length }}
      </div>
      <div v-if="comparison.rightOnly.length > 0" class="stat text-green-600 dark:text-green-400">
        <span class="font-semibold">Only in PDF 2:</span> {{ comparison.rightOnly.length }}
      </div>
      <div v-if="comparison.identical.length > 0" class="stat text-gray-500">
        <span class="font-semibold">Identical:</span> {{ comparison.identical.length }}
      </div>
    </div>

    <!-- Side-by-Side Comparison -->
    <div v-if="leftMetadata && rightMetadata" class="comparison-grid">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left PDF Metadata -->
        <div class="pdf-column">
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600"
          >
            {{ leftFileName }}
          </h3>
          <div class="metadata-content space-y-3">
            <MetadataSection
              :title="'Document Information'"
              :entries="filteredLeftInfo"
              :comparison="comparison"
              side="left"
            />
            <MetadataSection
              :title="'XMP Metadata'"
              :entries="filteredLeftXmp"
              :comparison="comparison"
              side="left"
            />
          </div>
        </div>

        <!-- Right PDF Metadata -->
        <div class="pdf-column">
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600"
          >
            {{ rightFileName }}
          </h3>
          <div class="metadata-content space-y-3">
            <MetadataSection
              :title="'Document Information'"
              :entries="filteredRightInfo"
              :comparison="comparison"
              side="right"
            />
            <MetadataSection
              :title="'XMP Metadata'"
              :entries="filteredRightXmp"
              :comparison="comparison"
              side="right"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- No Metadata Message -->
    <div
      v-else
      class="text-sm text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <p>No PDFs loaded for comparison</p>
    </div>

    <!-- No Results Message -->
    <div
      v-if="leftMetadata && rightMetadata && searchQuery && totalFilteredFields === 0"
      class="text-sm text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4"
    >
      <p>No metadata fields match your search query</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineComponent, h, type PropType } from 'vue'
import type { PdfMetadata, MetadataComparison } from '~/composables/usePdfMetadata'

const props = defineProps<{
  leftMetadata: PdfMetadata | null
  rightMetadata: PdfMetadata | null
  leftFileName?: string
  rightFileName?: string
}>()

const searchQuery = ref('')
const showOnlyDifferences = ref(false)

const { compareMetadata } = usePdfMetadata()

// Compute comparison
const comparison = computed<MetadataComparison | null>(() => {
  if (!props.leftMetadata || !props.rightMetadata) return null
  return compareMetadata(props.leftMetadata, props.rightMetadata)
})

// Helper to check if field has differences
const isDifferent = (field: string): boolean => {
  return comparison.value?.differences.includes(field) ?? false
}

// Helper to match search query
const matchesSearch = (key: string, value: any): boolean => {
  if (!searchQuery.value) return true
  const query = searchQuery.value.toLowerCase()
  return key.toLowerCase().includes(query) || String(value).toLowerCase().includes(query)
}

// Filter and format metadata entries
const filterEntries = (
  metadata: Record<string, any> | undefined,
  prefix: string
): Array<[string, any]> => {
  if (!metadata) return []

  return Object.entries(metadata)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false

      const field = `${prefix}.${key}`

      // Apply difference filter
      if (showOnlyDifferences.value && !isDifferent(field)) {
        return false
      }

      // Apply search filter
      if (!matchesSearch(key, value)) {
        return false
      }

      return true
    })
    .sort(([a], [b]) => a.localeCompare(b))
}

const filteredLeftInfo = computed(() => filterEntries(props.leftMetadata?.info, 'info'))
const filteredLeftXmp = computed(() => filterEntries(props.leftMetadata?.xmp, 'xmp'))
const filteredRightInfo = computed(() => filterEntries(props.rightMetadata?.info, 'info'))
const filteredRightXmp = computed(() => filterEntries(props.rightMetadata?.xmp, 'xmp'))

const totalFields = computed(() => {
  if (!comparison.value) return 0
  return comparison.value.differences.length + comparison.value.identical.length
})

const totalFilteredFields = computed(() => {
  return (
    filteredLeftInfo.value.length +
    filteredLeftXmp.value.length +
    filteredRightInfo.value.length +
    filteredRightXmp.value.length
  )
})

// MetadataSection component for rendering a section of metadata
const MetadataSection = defineComponent({
  props: {
    title: String,
    entries: Array as PropType<Array<[string, any]>>,
    comparison: Object as PropType<MetadataComparison | null>,
    side: String as PropType<'left' | 'right'>,
  },
  setup(props) {
    const { formatValue } = usePdfMetadata()

    const getFieldStatus = (key: string) => {
      if (!props.comparison) return 'identical'

      const field = `${props.title === 'Document Information' ? 'info' : 'xmp'}.${key}`

      if (props.comparison.changed.some((c) => c.field === field)) {
        return 'changed'
      }
      if (props.comparison.leftOnly.includes(field)) {
        return props.side === 'left' ? 'only-here' : 'missing'
      }
      if (props.comparison.rightOnly.includes(field)) {
        return props.side === 'right' ? 'only-here' : 'missing'
      }
      return 'identical'
    }

    const getRowClass = (status: string) => {
      switch (status) {
        case 'changed':
          return 'bg-yellow-200 dark:bg-yellow-900 border-l-4 border-yellow-500'
        case 'only-here':
          return props.side === 'left'
            ? 'bg-red-200 dark:bg-red-900 border-l-4 border-red-500'
            : 'bg-green-200 dark:bg-green-900 border-l-4 border-green-500'
        case 'missing':
          return 'bg-gray-200 dark:bg-gray-800 border-l-4 border-gray-400'
        default:
          return 'bg-white dark:bg-gray-800'
      }
    }

    return () => {
      if (!props.entries || props.entries.length === 0) return null

      return h('div', { class: 'metadata-section' }, [
        h(
          'h4',
          {
            class:
              'text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide',
          },
          props.title
        ),
        h(
          'div',
          { class: 'space-y-1' },
          props.entries.map(([key, value]) => {
            const status = getFieldStatus(key)
            return h(
              'div',
              {
                class: `metadata-row px-3 py-2 rounded text-sm ${getRowClass(status)}`,
              },
              [
                h('div', { class: 'font-semibold text-gray-900 dark:text-gray-100 mb-1' }, key),
                h(
                  'div',
                  { class: 'text-gray-800 dark:text-gray-200 break-all font-mono text-xs' },
                  formatValue(value)
                ),
              ]
            )
          })
        ),
      ])
    }
  },
})
</script>

<style scoped>
.metadata-diff-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pdf-column {
  min-width: 0; /* Allow grid items to shrink below content size */
}

.metadata-row {
  transition: all 0.15s ease;
}

.metadata-row:hover {
  transform: translateX(2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
