/**
 * Performance Monitoring Utility
 *
 * Tracks Web Vitals and custom performance metrics to measure
 * the real-world impact of optimizations.
 */

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export interface WebVitals {
  LCP?: PerformanceMetric // Largest Contentful Paint
  FID?: PerformanceMetric // First Input Delay
  CLS?: PerformanceMetric // Cumulative Layout Shift
  TTFB?: PerformanceMetric // Time to First Byte
  FCP?: PerformanceMetric // First Contentful Paint
}

// Web Vitals thresholds (from web.dev)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
}

/**
 * Rate a performance metric based on Web Vitals thresholds
 */
function rateMetric(
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Measure and log a custom performance mark
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>): void {
  const startMark = `${name}-start`
  const endMark = `${name}-end`

  performance.mark(startMark)

  const result = fn()

  if (result instanceof Promise) {
    result.finally(() => {
      performance.mark(endMark)
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0] as PerformanceEntry
        logPerformance(name, measure.duration)
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error)
      }
    })
  } else {
    performance.mark(endMark)
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0] as PerformanceEntry
      logPerformance(name, measure.duration)
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
    }
  }
}

/**
 * Log performance metric to console (in development) or analytics
 */
function logPerformance(name: string, duration: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
  }

  // Send to analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    ;(window as any).gtag('event', 'timing_complete', {
      name,
      value: Math.round(duration),
      event_category: 'Performance',
    })
  }
}

/**
 * Observe Web Vitals using PerformanceObserver
 */
export function observeWebVitals(callback?: (vitals: WebVitals) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  const vitals: WebVitals = {}

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      vitals.LCP = {
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        rating: rateMetric('LCP', lastEntry.renderTime || lastEntry.loadTime),
        timestamp: Date.now(),
      }

      if (callback) callback(vitals)

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] LCP: ${vitals.LCP.value.toFixed(2)}ms (${vitals.LCP.rating})`)
      }
    })

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (error) {
    console.warn('LCP observation failed:', error)
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        vitals.FID = {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: rateMetric('FID', entry.processingStart - entry.startTime),
          timestamp: Date.now(),
        }

        if (callback) callback(vitals)

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] FID: ${vitals.FID.value.toFixed(2)}ms (${vitals.FID.rating})`)
        }
      })
    })

    fidObserver.observe({ entryTypes: ['first-input'] })
  } catch (error) {
    console.warn('FID observation failed:', error)
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })

      vitals.CLS = {
        name: 'CLS',
        value: clsValue,
        rating: rateMetric('CLS', clsValue),
        timestamp: Date.now(),
      }

      if (callback) callback(vitals)

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] CLS: ${vitals.CLS.value.toFixed(3)} (${vitals.CLS.rating})`)
      }
    })

    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    console.warn('CLS observation failed:', error)
  }

  // First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        vitals.FCP = {
          name: 'FCP',
          value: entry.startTime,
          rating: rateMetric('FCP', entry.startTime),
          timestamp: Date.now(),
        }

        if (callback) callback(vitals)

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] FCP: ${vitals.FCP.value.toFixed(2)}ms (${vitals.FCP.rating})`)
        }
      })
    })

    fcpObserver.observe({ entryTypes: ['paint'] })
  } catch (error) {
    console.warn('FCP observation failed:', error)
  }

  // Time to First Byte (TTFB)
  if (performance.timing) {
    const ttfb = performance.timing.responseStart - performance.timing.requestStart
    vitals.TTFB = {
      name: 'TTFB',
      value: ttfb,
      rating: rateMetric('TTFB', ttfb),
      timestamp: Date.now(),
    }

    if (callback) callback(vitals)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] TTFB: ${vitals.TTFB.value.toFixed(2)}ms (${vitals.TTFB.rating})`)
    }
  }
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryInfo(): { used: number; limit: number; percentage: number } | null {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null
  }

  const memory = (performance as any).memory
  if (!memory) {
    return null
  }

  return {
    used: memory.usedJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  }
}

/**
 * Monitor bundle loading performance
 */
export function monitorBundleLoading(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (entry.initiatorType === 'script' && entry.name.includes('/_nuxt/')) {
          const size = entry.transferSize || entry.encodedBodySize
          const duration = entry.duration

          if (process.env.NODE_ENV === 'development') {
            console.log(
              `[Bundle] ${entry.name.split('/').pop()}: ${(size / 1024).toFixed(2)}KB in ${duration.toFixed(2)}ms`
            )
          }
        }
      })
    })

    resourceObserver.observe({ entryTypes: ['resource'] })
  } catch (error) {
    console.warn('Bundle monitoring failed:', error)
  }
}
