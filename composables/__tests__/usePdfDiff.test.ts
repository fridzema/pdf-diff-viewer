import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePdfDiff, type DiffOptions } from '../usePdfDiff'

describe('usePdfDiff', () => {
  let canvas1: HTMLCanvasElement
  let canvas2: HTMLCanvasElement
  let diffCanvas: HTMLCanvasElement
  let { comparePdfs } = usePdfDiff()

  // Helper to create a canvas with solid color
  const createColoredCanvas = (
    width: number,
    height: number,
    r: number,
    g: number,
    b: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(width, height)

    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = r
      imageData.data[i + 1] = g
      imageData.data[i + 2] = b
      imageData.data[i + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  // Helper to create a canvas with specific pattern
  const createPatternedCanvas = (
    width: number,
    height: number,
    pattern: (x: number, y: number) => [number, number, number]
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(width, height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const [r, g, b] = pattern(x, y)
        imageData.data[i] = r
        imageData.data[i + 1] = g
        imageData.data[i + 2] = b
        imageData.data[i + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  beforeEach(() => {
    // Reset the composable before each test
    const result = usePdfDiff()
    comparePdfs = result.comparePdfs

    canvas1 = document.createElement('canvas')
    canvas2 = document.createElement('canvas')
    diffCanvas = document.createElement('canvas')
  })

  describe('comparePdfs', () => {
    it('should throw error if canvas contexts cannot be obtained', () => {
      const badCanvas = document.createElement('canvas')
      vi.spyOn(badCanvas, 'getContext').mockReturnValue(null)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      expect(() => comparePdfs(badCanvas, canvas2, diffCanvas, options)).toThrow(
        'Failed to get canvas contexts'
      )
    })

    it('should return correct dimensions for diff result', () => {
      canvas1 = createColoredCanvas(100, 50, 255, 0, 0)
      canvas2 = createColoredCanvas(100, 50, 255, 0, 0)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(diffCanvas.width).toBe(100)
      expect(diffCanvas.height).toBe(50)
      expect(result.totalPixels).toBe(5000)
    })
  })

  describe('pixel diff mode', () => {
    it('should detect no differences when canvases are identical', () => {
      canvas1 = createColoredCanvas(10, 10, 255, 0, 0)
      canvas2 = createColoredCanvas(10, 10, 255, 0, 0)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(0)
      expect(result.percentDiff).toBe(0)
    })

    it('should detect all differences when canvases are completely different', () => {
      canvas1 = createColoredCanvas(10, 10, 255, 0, 0) // Red
      canvas2 = createColoredCanvas(10, 10, 0, 255, 0) // Green

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(100) // 10x10 = 100 pixels
      expect(result.percentDiff).toBe(100)
    })

    it('should highlight differences in red', () => {
      canvas1 = createColoredCanvas(2, 2, 255, 255, 255) // White
      canvas2 = createColoredCanvas(2, 2, 0, 0, 0) // Black

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // All pixels should be red (255, 0, 0)
      for (let i = 0; i < imageData.data.length; i += 4) {
        expect(imageData.data[i]).toBe(255) // R
        expect(imageData.data[i + 1]).toBe(0) // G
        expect(imageData.data[i + 2]).toBe(0) // B
        expect(imageData.data[i + 3]).toBe(255) // A
      }
    })

    it('should detect partial differences correctly', () => {
      // Create a canvas that's half red, half white
      canvas1 = createPatternedCanvas(10, 10, (x) => (x < 5 ? [255, 0, 0] : [255, 255, 255]))
      // Create a canvas that's all red
      canvas2 = createColoredCanvas(10, 10, 255, 0, 0)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(50) // Half of 100 pixels
      expect(result.percentDiff).toBe(50)
    })
  })

  describe('threshold diff mode', () => {
    it('should not detect small differences below threshold', () => {
      canvas1 = createColoredCanvas(10, 10, 100, 100, 100)
      canvas2 = createColoredCanvas(10, 10, 101, 101, 101) // Diff of 3 total

      const options: DiffOptions = {
        mode: 'threshold',
        threshold: 5, // Threshold higher than difference
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(0)
      expect(result.percentDiff).toBe(0)
    })

    it('should detect differences above threshold', () => {
      canvas1 = createColoredCanvas(10, 10, 100, 100, 100)
      canvas2 = createColoredCanvas(10, 10, 110, 110, 110) // Diff of 30 total

      const options: DiffOptions = {
        mode: 'threshold',
        threshold: 20, // Threshold lower than difference
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(100) // All pixels differ
      expect(result.percentDiff).toBe(100)
    })

    it('should work with zero threshold (same as pixel mode)', () => {
      canvas1 = createColoredCanvas(10, 10, 100, 100, 100)
      canvas2 = createColoredCanvas(10, 10, 100, 100, 101) // Tiny difference

      const options: DiffOptions = {
        mode: 'threshold',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(100) // All pixels differ
    })
  })

  describe('grayscale diff mode', () => {
    it('should convert colors to grayscale before comparing', () => {
      // Red and green can have similar grayscale values
      canvas1 = createColoredCanvas(10, 10, 255, 0, 0) // Red -> ~76 grayscale
      canvas2 = createColoredCanvas(10, 10, 0, 255, 0) // Green -> ~150 grayscale

      const options: DiffOptions = {
        mode: 'grayscale',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      // Should detect differences as grayscale values are different
      expect(result.differenceCount).toBeGreaterThan(0)
    })

    it('should not detect differences with identical grayscale values', () => {
      canvas1 = createColoredCanvas(10, 10, 128, 128, 128)
      canvas2 = createColoredCanvas(10, 10, 128, 128, 128)

      const options: DiffOptions = {
        mode: 'grayscale',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(0)
    })

    it('should respect threshold in grayscale mode', () => {
      canvas1 = createColoredCanvas(10, 10, 100, 100, 100) // Gray ~100
      canvas2 = createColoredCanvas(10, 10, 102, 102, 102) // Gray ~102

      const options: DiffOptions = {
        mode: 'grayscale',
        threshold: 5, // Higher than difference
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.differenceCount).toBe(0)
    })
  })

  describe('overlay diff mode', () => {
    it('should blend images for identical pixels', () => {
      canvas1 = createColoredCanvas(2, 2, 100, 100, 100)
      canvas2 = createColoredCanvas(2, 2, 100, 100, 100)

      const options: DiffOptions = {
        mode: 'overlay',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // Should be blended (50% of each)
      expect(imageData.data[0]).toBe(100) // (100 * 0.5 + 100 * 0.5)
    })

    it('should apply red overlay for differences', () => {
      canvas1 = createColoredCanvas(2, 2, 0, 0, 0) // Black
      canvas2 = createColoredCanvas(2, 2, 255, 255, 255) // White

      const options: DiffOptions = {
        mode: 'overlay',
        threshold: 10, // Low threshold
        overlayOpacity: 1.0, // Full opacity
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // With full opacity, should be pure red
      expect(imageData.data[0]).toBe(255) // R
      expect(imageData.data[1]).toBe(0) // G
      expect(imageData.data[2]).toBe(0) // B
    })

    it('should respect overlay opacity setting', () => {
      canvas1 = createColoredCanvas(2, 2, 100, 100, 100)
      canvas2 = createColoredCanvas(2, 2, 200, 200, 200)

      const options: DiffOptions = {
        mode: 'overlay',
        threshold: 10,
        overlayOpacity: 0.3,
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // Should be: r1 * (1 - 0.3) + 255 * 0.3 = 100 * 0.7 + 255 * 0.3 = 70 + 76.5 = 146.5
      // Note: Uint8ClampedArray stores integers, so we expect 146 or 147
      expect(imageData.data[0]).toBeGreaterThanOrEqual(146)
      expect(imageData.data[0]).toBeLessThanOrEqual(147)
    })
  })

  describe('heatmap diff mode', () => {
    it('should create heatmap for all pixels', () => {
      canvas1 = createColoredCanvas(10, 10, 0, 0, 0)
      canvas2 = createColoredCanvas(10, 10, 255, 255, 255)

      const options: DiffOptions = {
        mode: 'heatmap',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      // Should have processed all pixels
      expect(result.totalPixels).toBe(100)

      // Verify heatmap colors are applied
      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 10, 10)

      // All pixels should have some color (not black/transparent)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const hasColor =
          imageData.data[i] > 0 || imageData.data[i + 1] > 0 || imageData.data[i + 2] > 0
        expect(hasColor).toBe(true)
      }
    })

    it('should show blue for minimal differences', () => {
      canvas1 = createColoredCanvas(2, 2, 100, 100, 100)
      canvas2 = createColoredCanvas(2, 2, 101, 101, 101) // Very small diff

      const options: DiffOptions = {
        mode: 'heatmap',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // Should be mostly blue (low difference)
      expect(imageData.data[2]).toBeGreaterThan(imageData.data[0]) // B > R
    })

    it('should show red for maximum differences', () => {
      canvas1 = createColoredCanvas(2, 2, 0, 0, 0)
      canvas2 = createColoredCanvas(2, 2, 255, 255, 255)

      const options: DiffOptions = {
        mode: 'heatmap',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      comparePdfs(canvas1, canvas2, diffCanvas, options)

      const ctx = diffCanvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, 2, 2)

      // Should be mostly red (high difference)
      expect(imageData.data[0]).toBeGreaterThan(imageData.data[2]) // R > B
    })
  })

  describe('edge cases', () => {
    it('should handle 1x1 canvas', () => {
      canvas1 = createColoredCanvas(1, 1, 255, 0, 0)
      canvas2 = createColoredCanvas(1, 1, 0, 255, 0)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.totalPixels).toBe(1)
      expect(result.differenceCount).toBe(1)
      expect(result.percentDiff).toBe(100)
    })

    it('should handle large canvas dimensions', () => {
      canvas1 = createColoredCanvas(1000, 1000, 100, 100, 100)
      canvas2 = createColoredCanvas(1000, 1000, 100, 100, 100)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.totalPixels).toBe(1000000)
      expect(result.differenceCount).toBe(0)
    })

    it('should calculate percentage correctly for partial differences', () => {
      // 100 pixels, 25 different
      canvas1 = createPatternedCanvas(10, 10, (x, y) => (x < 5 && y < 5 ? [255, 0, 0] : [0, 0, 0]))
      canvas2 = createColoredCanvas(10, 10, 0, 0, 0)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result.totalPixels).toBe(100)
      expect(result.differenceCount).toBe(25)
      expect(result.percentDiff).toBe(25)
    })
  })

  describe('performance and correctness', () => {
    it('should process all modes without errors', () => {
      canvas1 = createColoredCanvas(50, 50, 128, 128, 128)
      canvas2 = createColoredCanvas(50, 50, 130, 130, 130)

      const modes: Array<DiffOptions['mode']> = [
        'pixel',
        'threshold',
        'grayscale',
        'overlay',
        'heatmap',
      ]

      modes.forEach((mode) => {
        const options: DiffOptions = {
          mode,
          threshold: 5,
          overlayOpacity: 0.5,
          useGrayscale: false,
        }

        expect(() => comparePdfs(canvas1, canvas2, diffCanvas, options)).not.toThrow()
      })
    })

    it('should return consistent results across multiple runs', () => {
      canvas1 = createColoredCanvas(20, 20, 100, 100, 100)
      canvas2 = createColoredCanvas(20, 20, 150, 150, 150)

      const options: DiffOptions = {
        mode: 'pixel',
        threshold: 0,
        overlayOpacity: 0.5,
        useGrayscale: false,
      }

      const result1 = comparePdfs(canvas1, canvas2, diffCanvas, options)
      const result2 = comparePdfs(canvas1, canvas2, diffCanvas, options)

      expect(result1.differenceCount).toBe(result2.differenceCount)
      expect(result1.percentDiff).toBe(result2.percentDiff)
    })
  })
})
