<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Upload Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <!-- Collapsible Header Button -->
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          @click="uiStore.toggleUploadSection()"
        >
          <h3 class="text-lg font-semibold text-gray-800">Upload PDF Files</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': !uiStore.uploadSectionExpanded }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Collapsible Content with Transition -->
        <transition name="expand" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
          <div v-show="uiStore.uploadSectionExpanded" class="overflow-hidden">
            <div class="p-6 pt-2">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left PDF Upload -->
                <PdfUploader label="Upload First PDF" @file-selected="handleLeftFileSelected" />

                <!-- Right PDF Upload -->
                <PdfUploader label="Upload Second PDF" @file-selected="handleRightFileSelected" />
              </div>

              <!-- Info Message -->
              <div
                v-if="!pdfStore.canCompare"
                class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div class="flex items-start">
                  <svg
                    class="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 class="text-sm font-medium text-blue-900">Getting Started</h3>
                    <p class="mt-1 text-sm text-blue-700">
                      Upload two PDF files to begin comparing. The comparison will automatically run
                      once both files are loaded.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Comparison Section -->
      <div v-if="pdfStore.canCompare">
        <ClientOnly>
          <Suspense>
            <template #default>
              <LazyPdfDiff
                :left-file="pdfStore.leftFile"
                :right-file="pdfStore.rightFile"
                :left-metadata="pdfStore.leftMetadata"
                :right-metadata="pdfStore.rightMetadata"
              />
            </template>
            <template #fallback>
              <div class="flex items-center justify-center p-12 bg-white rounded-lg shadow-sm">
                <div class="text-center">
                  <svg
                    class="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p class="text-gray-600">Loading comparison tools...</p>
                </div>
              </div>
            </template>
          </Suspense>
        </ClientOnly>
      </div>

      <!-- Feature Info Section -->
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Features</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Multiple Comparison Modes</h3>
              <p class="mt-2 text-sm text-gray-600">
                Choose from pixel difference, threshold mode, grayscale, overlay, or heatmap views
                to analyze differences.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Configurable Settings</h3>
              <p class="mt-2 text-sm text-gray-600">
                Adjust sensitivity threshold and overlay opacity to fine-tune the comparison to your
                needs.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Real-Time Processing</h3>
              <p class="mt-2 text-sm text-gray-600">
                All PDF rendering and comparison happens entirely in your browser - no server
                required.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Detailed Statistics & Metadata</h3>
              <p class="mt-2 text-sm text-gray-600">
                View exact pixel counts, percentage differences, and compare PDF metadata
                side-by-side with filtering and search.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { usePdfStore } from '~/stores/pdf'
import { useUiStore } from '~/stores/ui'

// Use Pinia stores for state management
const pdfStore = usePdfStore()
const uiStore = useUiStore()

const { extractMetadata } = usePdfMetadata()

// Auto-collapse upload section when both files are selected
watch(
  () => pdfStore.canCompare,
  (canCompare) => {
    if (canCompare) {
      uiStore.collapseUploadSection()
    }
  }
)

const handleLeftFileSelected = async (file: File) => {
  pdfStore.setLeftFile(file)
  try {
    const metadata = await extractMetadata(file)
    pdfStore.setLeftMetadata(metadata)
  } catch (error) {
    console.error('Error extracting left PDF metadata:', error)
    pdfStore.setLeftMetadata(null)
  }
}

const handleRightFileSelected = async (file: File) => {
  pdfStore.setRightFile(file)
  try {
    const metadata = await extractMetadata(file)
    pdfStore.setRightMetadata(metadata)
  } catch (error) {
    console.error('Error extracting right PDF metadata:', error)
    pdfStore.setRightMetadata(null)
  }
}

// Transition handlers for smooth collapse/expand animations
const onEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.opacity = '0'
}

const onAfterEnter = (el: HTMLElement) => {
  el.style.height = 'auto'
  el.style.opacity = '1'
  el.style.transition = 'height 0.3s ease-out, opacity 0.3s ease-out'
}

const onLeave = (el: HTMLElement) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.opacity = '1'

  // Force reflow (intentionally reading offsetHeight to trigger layout)
  void el.offsetHeight

  el.style.transition = 'height 0.3s ease-in, opacity 0.3s ease-in'
  el.style.height = '0'
  el.style.opacity = '0'
}
</script>
