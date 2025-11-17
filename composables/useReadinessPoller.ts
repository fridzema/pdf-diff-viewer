import { logger } from '~/utils/logger'

export interface ReadinessPollerOptions {
  maxAttempts?: number
  interval?: number
  condition: () => boolean
  onReady: () => void
  onTimeout?: () => void
}

/**
 * Utility composable for polling until a readiness condition is met
 * Replaces duplicate polling logic throughout the codebase
 *
 * @param options - Configuration options for the poller
 * @returns Object with start, stop, and cleanup functions
 */
export function useReadinessPoller(options: ReadinessPollerOptions) {
  const { maxAttempts = 10, interval = 200, condition, onReady, onTimeout } = options

  let timeoutId: number | null = null
  let attempts = 0

  const checkAndRun = () => {
    logger.log(`Readiness check (attempt ${attempts + 1}/${maxAttempts})`)

    if (condition()) {
      logger.log('Condition met, executing callback')
      cleanup()
      onReady()
    } else if (attempts < maxAttempts) {
      attempts++
      timeoutId = setTimeout(checkAndRun, interval) as unknown as number
    } else {
      logger.warn('Condition not met after', maxAttempts, 'attempts')
      cleanup()
      if (onTimeout) {
        onTimeout()
      }
    }
  }

  const start = () => {
    logger.log('Starting readiness poller:', { maxAttempts, interval })
    cleanup() // Clean up any existing timeout
    attempts = 0
    checkAndRun()
  }

  const stop = () => {
    logger.log('Stopping readiness poller')
    cleanup()
  }

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return {
    start,
    stop,
    cleanup,
  }
}
