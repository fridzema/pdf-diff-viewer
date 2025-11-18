import * as pdfjsLib from 'pdfjs-dist'
import { logger } from '~/utils/logger'

export default defineNuxtPlugin(() => {
  // Set up PDF.js worker - Import from pdfjs-dist package for proper bundling
  // Vite will handle asset hashing and optimization
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString()

  if (process.env.NODE_ENV === 'development') {
    logger.log('PDF.js initialized with version:', pdfjsLib.version)
    logger.log('Worker path:', pdfjsLib.GlobalWorkerOptions.workerSrc)
  }
})
