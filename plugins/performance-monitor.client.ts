import { observeWebVitals, monitorBundleLoading } from '~/utils/performance-monitor'

export default defineNuxtPlugin(() => {
  // Only monitor in development or if explicitly enabled
  const shouldMonitor =
    process.env.NODE_ENV === 'development' ||
    process.env.NUXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'

  if (!shouldMonitor) {
    return
  }

  // Start observing Web Vitals
  observeWebVitals((_vitals) => {
    // Vitals are logged automatically in development
    // In production, you could send to analytics here
  })

  // Monitor bundle loading performance
  monitorBundleLoading()

  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance Monitor] Initialized - tracking Web Vitals and bundle loading')
  }
})
