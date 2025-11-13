import * as pdfjsLib from 'pdfjs-dist'

export default defineNuxtPlugin(() => {
  // Set up PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  console.log('PDF.js initialized with version:', pdfjsLib.version)
  console.log('Worker path:', pdfjsLib.GlobalWorkerOptions.workerSrc)
})
