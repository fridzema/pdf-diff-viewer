<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <!-- Offline Icon -->
      <div class="mb-6">
        <svg
          class="w-24 h-24 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>

      <!-- Description -->
      <p class="text-gray-600 mb-6">
        It looks like you've lost your internet connection. PDF Diff Viewer requires an active
        connection to load PDF files.
      </p>

      <!-- Cached Status -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-start">
          <svg
            class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="text-left">
            <p class="text-sm font-medium text-blue-900">Some content is cached</p>
            <p class="text-sm text-blue-700 mt-1">
              The app interface is available offline, but you'll need an internet connection to
              upload and compare PDF files.
            </p>
          </div>
        </div>
      </div>

      <!-- Retry Button -->
      <button
        class="w-full bg-primary-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
        @click="retry"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Try Again
      </button>

      <!-- Connection Status -->
      <p class="text-sm text-gray-500 mt-4">
        Connection status: <span class="font-medium text-red-600">Offline</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const retry = () => {
  // Attempt to reload the page
  window.location.reload()
}

// Auto-retry when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    window.location.reload()
  })
}
</script>
