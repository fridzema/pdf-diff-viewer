import * as pdfjsLib from 'pdfjs-dist'

export default defineNuxtPlugin(() => {
  // Set up PDF.js worker - Use locally bundled worker instead of CDN for security
  // The worker file is located in the public directory and served as a static asset
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  if (process.env.NODE_ENV === 'development') {
    console.log('PDF.js initialized with version:', pdfjsLib.version)
    console.log('Worker path:', pdfjsLib.GlobalWorkerOptions.workerSrc)
  }
})
