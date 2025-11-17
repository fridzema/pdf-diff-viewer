<template>
  <div
    class="pdf-uploader"
    :class="{ 'drag-over': isDragOver }"
    @drop.prevent="handleDrop"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
  >
    <div
      class="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors"
      :class="
        isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
      "
    >
      <svg
        class="w-12 h-12 mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <p class="mb-2 text-sm text-gray-600">
        <span class="font-semibold">{{ label }}</span>
      </p>
      <p class="text-xs text-gray-500 mb-4">Click to browse or drag and drop</p>

      <input
        ref="fileInput"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="handleFileChange"
      />

      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        @click="triggerFileInput"
      >
        Choose File
      </button>

      <div v-if="fileName" class="mt-4 text-sm text-gray-700">
        <span class="font-medium">Selected:</span> {{ fileName }}
      </div>

      <div v-if="error" class="mt-2 text-sm text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>()

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref<string>('')
const error = ref<string>('')
const isDragOver = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const validateFile = (file: File): boolean => {
  error.value = ''

  if (file.type !== 'application/pdf') {
    error.value = 'Please select a PDF file'
    return false
  }

  if (file.size > 200 * 1024 * 1024) {
    // 200MB limit
    error.value = 'File size must be less than 200MB'
    return false
  }

  return true
}

const handleFile = (file: File) => {
  if (validateFile(file)) {
    fileName.value = file.name
    emit('fileSelected', file)
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFile(file)
  }
}
</script>

<style scoped>
.pdf-uploader {
  width: 100%;
}
</style>
