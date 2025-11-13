<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">PDF Diff Viewer</h1>
        <p class="text-gray-600 mt-2">
          Compare two PDF files visually with multiple comparison modes
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Upload Section -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Upload PDF Files</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left PDF Upload -->
          <PdfUploader
            label="Upload First PDF"
            @file-selected="handleLeftFileSelected"
          />

          <!-- Right PDF Upload -->
          <PdfUploader
            label="Upload Second PDF"
            @file-selected="handleRightFileSelected"
          />
        </div>

        <!-- Info Message -->
        <div v-if="!leftFile || !rightFile" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-blue-900">Getting Started</h3>
              <p class="mt-1 text-sm text-blue-700">
                Upload two PDF files to begin comparing. The comparison will automatically run once both files are loaded.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Section -->
      <div v-if="leftFile && rightFile">
        <PdfDiff
          :left-file="leftFile"
          :right-file="rightFile"
        />
      </div>

      <!-- Feature Info Section -->
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Features</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Multiple Comparison Modes</h3>
              <p class="mt-2 text-sm text-gray-600">
                Choose from pixel difference, threshold mode, grayscale, overlay, or heatmap views to analyze differences.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Configurable Settings</h3>
              <p class="mt-2 text-sm text-gray-600">
                Adjust sensitivity threshold and overlay opacity to fine-tune the comparison to your needs.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Real-Time Processing</h3>
              <p class="mt-2 text-sm text-gray-600">
                All PDF rendering and comparison happens entirely in your browser - no server required.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Detailed Statistics</h3>
              <p class="mt-2 text-sm text-gray-600">
                View exact pixel counts and percentage differences between your PDF files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="container mx-auto px-4 py-6">
        <p class="text-center text-gray-600 text-sm">
          Built with Nuxt 3, TailwindCSS, and PDF.js
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const leftFile = ref<File | null>(null)
const rightFile = ref<File | null>(null)

const handleLeftFileSelected = (file: File) => {
  leftFile.value = file
}

const handleRightFileSelected = (file: File) => {
  rightFile.value = file
}
</script>
