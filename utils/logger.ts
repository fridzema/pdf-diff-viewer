/**
 * Simple logger utility that respects NODE_ENV
 * Development: All logs are displayed
 * Production: Only errors are displayed
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log informational messages (development only)
   */
  log(...args: any[]) {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn(...args: any[]) {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log error messages (always logged, even in production)
   */
  error(...args: any[]) {
    console.error(...args)
  },
}
