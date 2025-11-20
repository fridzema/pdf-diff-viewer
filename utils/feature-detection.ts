import { logger } from '~/utils/logger'

/**
 * Feature Detection Utility
 *
 * Detects browser capabilities for progressive enhancement
 * and graceful fallbacks.
 */

export interface BrowserCapabilities {
  webgl2: boolean
  webWorkers: boolean
  offscreenCanvas: boolean
  imageCapture: boolean
  serviceWorker: boolean
  indexedDB: boolean
  fileAPI: boolean
  memoryInfo: boolean
}

let cachedCapabilities: BrowserCapabilities | null = null

interface PerformanceMemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

type PerformanceWithMemory = Performance & {
  memory?: PerformanceMemoryInfo
}

/**
 * Detect all browser capabilities
 */
export function detectCapabilities(): BrowserCapabilities {
  // Return cached result if available
  if (cachedCapabilities) {
    return cachedCapabilities
  }

  if (typeof window === 'undefined') {
    // Server-side or non-browser environment
    return {
      webgl2: false,
      webWorkers: false,
      offscreenCanvas: false,
      imageCapture: false,
      serviceWorker: false,
      indexedDB: false,
      fileAPI: false,
      memoryInfo: false,
    }
  }

  cachedCapabilities = {
    webgl2: detectWebGL2(),
    webWorkers: detectWebWorkers(),
    offscreenCanvas: detectOffscreenCanvas(),
    imageCapture: detectImageCapture(),
    serviceWorker: detectServiceWorker(),
    indexedDB: detectIndexedDB(),
    fileAPI: detectFileAPI(),
    memoryInfo: detectMemoryInfo(),
  }

  return cachedCapabilities
}

/**
 * Detect WebGL 2 support
 */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    return gl !== null
  } catch {
    return false
  }
}

/**
 * Detect Web Workers support
 */
export function detectWebWorkers(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Detect OffscreenCanvas support
 */
export function detectOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined'
}

/**
 * Detect ImageCapture API support
 */
export function detectImageCapture(): boolean {
  return 'ImageCapture' in window
}

/**
 * Detect Service Worker support
 */
export function detectServiceWorker(): boolean {
  return 'serviceWorker' in navigator
}

/**
 * Detect IndexedDB support
 */
export function detectIndexedDB(): boolean {
  return 'indexedDB' in window
}

/**
 * Detect File API support
 */
export function detectFileAPI(): boolean {
  return typeof File !== 'undefined' && typeof FileReader !== 'undefined'
}

/**
 * Detect memory info availability (Chrome only)
 */
export function detectMemoryInfo(): boolean {
  return 'memory' in performance
}

/**
 * Get WebGL renderer info (for debugging)
 */
export function getWebGLInfo(): {
  vendor: string
  renderer: string
  version: string
  shadingLanguageVersion: string
} | null {
  if (!detectWebGL2()) {
    return null
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return null

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) {
      return {
        vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
        renderer: gl.getParameter(gl.RENDERER) || 'Unknown',
        version: gl.getParameter(gl.VERSION) || 'Unknown',
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown',
      }
    }

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown',
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown',
      version: gl.getParameter(gl.VERSION) || 'Unknown',
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown',
    }
  } catch {
    return null
  }
}

/**
 * Log capabilities to console (development only)
 */
export function logCapabilities(): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const caps = detectCapabilities()
  logger.log('[Feature Detection] Browser Capabilities:', caps)

  if (caps.webgl2) {
    const webglInfo = getWebGLInfo()
    if (webglInfo) {
      logger.log('[WebGL Info]', webglInfo)
    }
  }

  if (caps.memoryInfo) {
    const memory = (performance as PerformanceWithMemory).memory
    if (memory) {
      logger.log('[Memory Info]', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      })
    }
  }
}

/**
 * Composable for using feature detection in Vue components
 */
export function useFeatureDetection() {
  const capabilities = ref<BrowserCapabilities | null>(null)
  const isLoading = ref(true)

  onMounted(() => {
    capabilities.value = detectCapabilities()
    isLoading.value = false

    if (process.env.NODE_ENV === 'development') {
      logCapabilities()
    }
  })

  return {
    capabilities: readonly(capabilities),
    isLoading: readonly(isLoading),
    hasWebGL2: computed(() => capabilities.value?.webgl2 ?? false),
    hasWebWorkers: computed(() => capabilities.value?.webWorkers ?? false),
    hasOffscreenCanvas: computed(() => capabilities.value?.offscreenCanvas ?? false),
    hasServiceWorker: computed(() => capabilities.value?.serviceWorker ?? false),
  }
}
