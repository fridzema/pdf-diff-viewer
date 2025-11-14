import { vi } from 'vitest'

// Mock PDF.js
const mockPdfDocument = {
  numPages: 1,
  getPage: vi.fn().mockResolvedValue({
    getViewport: vi.fn(() => ({
      width: 800,
      height: 1000,
      scale: 1,
    })),
    render: vi.fn(() => ({
      promise: Promise.resolve(),
    })),
  }),
  destroy: vi.fn(),
}

vi.mock('pdfjs-dist', () => ({
  default: {
    getDocument: vi.fn(() => ({
      promise: Promise.resolve(mockPdfDocument),
    })),
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}))

// Mock canvas context with proper getContext implementation
// Store contexts for each canvas to ensure same context is returned on subsequent calls
const canvasContexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()

HTMLCanvasElement.prototype.getContext = function (contextType: string, _options?: any) {
  if (contextType === '2d') {
    // Return existing context if we have one
    if (canvasContexts.has(this)) {
      return canvasContexts.get(this)!
    }

    // Store image data for this canvas
    let storedImageData: ImageData | null = null

    const context = {
      canvas: this,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn((x: number, y: number, width: number, height: number) => {
        // If we have stored data, return it
        if (
          storedImageData &&
          storedImageData.width === width &&
          storedImageData.height === height
        ) {
          return {
            data: new Uint8ClampedArray(storedImageData.data),
            width: storedImageData.width,
            height: storedImageData.height,
            colorSpace: 'srgb' as PredefinedColorSpace,
          }
        }
        // Otherwise return empty data
        return {
          data: new Uint8ClampedArray(width * height * 4),
          width,
          height,
          colorSpace: 'srgb' as PredefinedColorSpace,
        }
      }),
      putImageData: vi.fn((imageData: ImageData, _dx: number, _dy: number) => {
        // Store the image data
        storedImageData = {
          data: new Uint8ClampedArray(imageData.data),
          width: imageData.width,
          height: imageData.height,
          colorSpace: 'srgb' as PredefinedColorSpace,
        } as ImageData
      }),
      createImageData: vi.fn((width: number | ImageData, height?: number) => {
        if (typeof width === 'number' && typeof height === 'number') {
          return {
            data: new Uint8ClampedArray(width * height * 4),
            width,
            height,
            colorSpace: 'srgb' as PredefinedColorSpace,
          } as ImageData
        }
        const imageData = width as ImageData
        return {
          data: new Uint8ClampedArray(imageData.width * imageData.height * 4),
          width: imageData.width,
          height: imageData.height,
          colorSpace: 'srgb' as PredefinedColorSpace,
        } as ImageData
      }),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
    } as any

    // Store context for this canvas
    canvasContexts.set(this, context)
    return context
  }
  return null
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 0)
  return 0
})

global.cancelAnimationFrame = vi.fn()

// Suppress console warnings in tests (optional)
// global.console.warn = vi.fn()
