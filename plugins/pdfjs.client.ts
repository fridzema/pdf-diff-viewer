import { logger } from '~/utils/logger'

/**
 * PDF.js plugin - DISABLED
 *
 * This plugin has been disabled in favor of lazy loading PDF.js only when needed.
 * The lazy loader in utils/pdfjs-loader.ts handles PDF.js initialization,
 * which significantly reduces initial bundle size by ~1.37MB.
 *
 * PDF.js is now loaded on-demand when a user uploads their first PDF file.
 */
export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'development') {
    logger.log('PDF.js lazy loading enabled - library will load on first PDF upload')
  }
})
