import { defineStore } from 'pinia'
import type { PdfMetadata } from '~/composables/usePdfMetadata'

export const usePdfStore = defineStore('pdf', () => {
  // State
  const leftFile = ref<File | null>(null)
  const rightFile = ref<File | null>(null)
  const leftMetadata = ref<PdfMetadata | null>(null)
  const rightMetadata = ref<PdfMetadata | null>(null)

  // Getters (computed)
  const canCompare = computed(() => leftFile.value !== null && rightFile.value !== null)

  const filesLoaded = computed(() => ({
    left: leftFile.value !== null,
    right: rightFile.value !== null,
    both: canCompare.value,
  }))

  // Actions
  function setLeftFile(file: File | null) {
    leftFile.value = file
    if (!file) {
      leftMetadata.value = null
    }
  }

  function setRightFile(file: File | null) {
    rightFile.value = file
    if (!file) {
      rightMetadata.value = null
    }
  }

  function setLeftMetadata(metadata: PdfMetadata | null) {
    leftMetadata.value = metadata
  }

  function setRightMetadata(metadata: PdfMetadata | null) {
    rightMetadata.value = metadata
  }

  function reset() {
    leftFile.value = null
    rightFile.value = null
    leftMetadata.value = null
    rightMetadata.value = null
  }

  return {
    // State
    leftFile,
    rightFile,
    leftMetadata,
    rightMetadata,

    // Getters
    canCompare,
    filesLoaded,

    // Actions
    setLeftFile,
    setRightFile,
    setLeftMetadata,
    setRightMetadata,
    reset,
  }
})
