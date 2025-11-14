<template>
  <div class="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex-wrap">
    <!-- Zoom Out Button -->
    <button
      :disabled="currentZoom <= zoomLevels[0]"
      class="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :title="isMac ? 'Zoom Out (⌘-)' : 'Zoom Out (Ctrl+-)'"
      @click="decreaseZoom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
        />
      </svg>
    </button>

    <!-- Zoom Percentage Dropdown -->
    <select
      :value="currentZoom"
      class="px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
      :title="isMac ? 'Zoom Level (⌘+Wheel)' : 'Zoom Level (Ctrl+Wheel)'"
      @change="handleZoomChange"
    >
      <option v-for="level in zoomLevels" :key="level" :value="level">{{ level }}%</option>
    </select>

    <!-- Zoom In Button -->
    <button
      :disabled="currentZoom >= zoomLevels[zoomLevels.length - 1]"
      class="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :title="isMac ? 'Zoom In (⌘+)' : 'Zoom In (Ctrl++)'"
      @click="increaseZoom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
        />
      </svg>
    </button>

    <!-- Divider -->
    <div class="h-8 w-px bg-gray-300"></div>

    <!-- Quick Action Buttons -->
    <button
      class="px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
      :title="isMac ? 'Reset to 100% (⌘0)' : 'Reset to 100% (Ctrl+0)'"
      @click="resetZoom"
    >
      100%
    </button>

    <button
      v-if="onFitWidth"
      class="px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
      :title="isMac ? 'Fit Width (⌘9)' : 'Fit Width (Ctrl+9)'"
      @click="onFitWidth"
    >
      Fit Width
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number // Current zoom level as percentage (e.g., 100)
  onFitWidth?: () => void // Optional fit width callback
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Detect if we're on Mac for keyboard shortcut hints
const isMac = computed(() => {
  if (typeof navigator !== 'undefined') {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }
  return false
})

// Available zoom levels (in percentages)
const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400, 500, 750, 1000]

const currentZoom = computed(() => props.modelValue)

const handleZoomChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newZoom = parseInt(target.value)
  emit('update:modelValue', newZoom)
}

const increaseZoom = () => {
  const currentIndex = zoomLevels.indexOf(currentZoom.value)
  if (currentIndex < zoomLevels.length - 1) {
    emit('update:modelValue', zoomLevels[currentIndex + 1])
  }
}

const decreaseZoom = () => {
  const currentIndex = zoomLevels.indexOf(currentZoom.value)
  if (currentIndex > 0) {
    emit('update:modelValue', zoomLevels[currentIndex - 1])
  }
}

const resetZoom = () => {
  emit('update:modelValue', 100)
}
</script>
