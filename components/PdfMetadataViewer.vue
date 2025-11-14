<template>
  <div v-if="metadata" class="metadata-viewer space-y-4">
    <!-- Document Information Section -->
    <div v-if="metadata.info && Object.keys(metadata.info).length > 0" class="metadata-section">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Document Information</h4>
        <button
          class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="infoExpanded = !infoExpanded"
        >
          {{ infoExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>

      <div v-if="infoExpanded" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
        <div
          v-for="[key, value] in sortedInfoEntries"
          :key="key"
          class="metadata-row flex justify-between items-start text-xs"
        >
          <span class="font-medium text-gray-600 dark:text-gray-400 w-1/3">{{ key }}:</span>
          <span class="text-gray-800 dark:text-gray-200 w-2/3 text-right break-all">
            {{ formatValue(value) }}
          </span>
        </div>
      </div>
    </div>

    <!-- XMP Metadata Section -->
    <div v-if="metadata.xmp && Object.keys(metadata.xmp).length > 0" class="metadata-section">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">XMP Metadata</h4>
        <button
          class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="xmpExpanded = !xmpExpanded"
        >
          {{ xmpExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>

      <div v-if="xmpExpanded" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
        <div
          v-for="[key, value] in sortedXmpEntries"
          :key="key"
          class="metadata-row flex justify-between items-start text-xs"
        >
          <span class="font-medium text-gray-600 dark:text-gray-400 w-1/3">{{ key }}:</span>
          <span class="text-gray-800 dark:text-gray-200 w-2/3 text-right break-all">
            {{ formatValue(value) }}
          </span>
        </div>
      </div>
    </div>

    <!-- No Metadata Message -->
    <div
      v-if="
        (!metadata.info || Object.keys(metadata.info).length === 0) &&
        (!metadata.xmp || Object.keys(metadata.xmp).length === 0)
      "
      class="text-sm text-gray-500 dark:text-gray-400 text-center py-4"
    >
      No metadata available
    </div>
  </div>

  <div v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No PDF loaded</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PdfMetadata } from '~/composables/usePdfMetadata'

const props = defineProps<{
  metadata: PdfMetadata | null
}>()

const infoExpanded = ref(true)
const xmpExpanded = ref(false)

const { formatValue } = usePdfMetadata()

const sortedInfoEntries = computed(() => {
  if (!props.metadata?.info) return []
  return Object.entries(props.metadata.info)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
})

const sortedXmpEntries = computed(() => {
  if (!props.metadata?.xmp) return []
  return Object.entries(props.metadata.xmp)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
})
</script>

<style scoped>
.metadata-viewer {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.metadata-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.dark .metadata-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
