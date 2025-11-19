import type * as PDFJSTypes from 'pdfjs-dist'

// Singleton promise to ensure we only load PDF.js once
let pdfjsPromise: Promise<typeof PDFJSTypes> | null = null

/**
 * Lazy loads PDF.js library only when needed
 * This significantly reduces initial bundle size by ~1.37MB
 * @returns Promise resolving to the PDF.js library
 */
export async function loadPdfJs(): Promise<typeof PDFJSTypes> {
  // Return existing promise if already loading/loaded
  if (pdfjsPromise) {
    return pdfjsPromise
  }

  // Create new promise for loading PDF.js
  pdfjsPromise = (async () => {
    try {
      // Dynamically import PDF.js
      const pdfjsLib = await import('pdfjs-dist')

      // Configure worker using dynamic import for the worker file
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString()

      return pdfjsLib
    } catch (error) {
      // Reset promise on error so it can be retried
      pdfjsPromise = null
      throw new Error(
        `Failed to load PDF.js: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })()

  return pdfjsPromise
}

/**
 * Preload PDF.js in the background (optional)
 * Useful for preloading when user is likely to need it soon
 */
export function preloadPdfJs(): void {
  // Start loading in background if not already loaded
  if (!pdfjsPromise) {
    loadPdfJs().catch((error) => {
      console.warn('PDF.js preload failed:', error)
    })
  }
}

/**
 * Check if PDF.js is already loaded
 */
export function isPdfJsLoaded(): boolean {
  return pdfjsPromise !== null
}
