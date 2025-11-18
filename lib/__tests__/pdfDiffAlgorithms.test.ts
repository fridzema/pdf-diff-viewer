import { describe, it, expect } from 'vitest'
import {
  type DiffOptions,
  pixelDiff,
  thresholdDiff,
  grayscaleDiff,
  overlayDiff,
  heatmapDiff,
  semanticDiff,
} from '../pdfDiffAlgorithms'

describe('pdfDiffAlgorithms', () => {
  // Helper to create test image data
  const createImageData = (pixels: number[][]): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(pixels.length * 4)
    pixels.forEach(([r, g, b, a], i) => {
      data[i * 4] = r
      data[i * 4 + 1] = g
      data[i * 4 + 2] = b
      data[i * 4 + 3] = a || 255
    })
    return data
  }

  const defaultOptions: DiffOptions = {
    mode: 'pixel',
    threshold: 0,
    overlayOpacity: 0.5,
    useGrayscale: false,
  }

  describe('pixelDiff', () => {
    it('should detect identical pixels', () => {
      const data1 = createImageData([
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ])
      const data2 = createImageData([
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ])
      const diffData = new Uint8ClampedArray(8)
      const originalData = new Uint8ClampedArray(8)

      const count = pixelDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(0)
      // First pixel should be preserved (identical)
      expect(diffData[0]).toBe(255) // R
      expect(diffData[1]).toBe(0) // G
      expect(diffData[2]).toBe(0) // B
    })

    it('should detect different pixels and mark them red', () => {
      const data1 = createImageData([
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ])
      const data2 = createImageData([
        [0, 0, 255, 255],
        [255, 255, 255, 255],
      ])
      const diffData = new Uint8ClampedArray(8)
      const originalData = new Uint8ClampedArray(8)

      const count = pixelDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(2) // Both pixels different
      // Different pixels should be red
      expect(diffData[0]).toBe(255) // R
      expect(diffData[1]).toBe(0) // G
      expect(diffData[2]).toBe(0) // B
    })

    it('should populate originalData correctly', () => {
      const data1 = createImageData([[100, 150, 200, 255]])
      const data2 = createImageData([[100, 150, 200, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      pixelDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(originalData[0]).toBe(100)
      expect(originalData[1]).toBe(150)
      expect(originalData[2]).toBe(200)
      expect(originalData[3]).toBe(255)
    })
  })

  describe('thresholdDiff', () => {
    it('should ignore differences below threshold', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[102, 102, 102, 255]]) // Diff = 2 per channel, total = 6
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      const count = thresholdDiff(
        data1,
        data2,
        diffData,
        { ...defaultOptions, threshold: 10 },
        originalData
      )

      expect(count).toBe(0) // Total diff of 6 is below threshold of 10
    })

    it('should detect differences above threshold', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[115, 115, 115, 255]]) // Diff = 15 per channel, total = 45
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      const count = thresholdDiff(
        data1,
        data2,
        diffData,
        { ...defaultOptions, threshold: 10 },
        originalData
      )

      expect(count).toBe(1) // Above threshold
      expect(diffData[0]).toBe(255) // Marked as red
    })
  })

  describe('grayscaleDiff', () => {
    it('should convert to grayscale and compare', () => {
      // Red and green with same luminance
      const data1 = createImageData([[255, 0, 0, 255]]) // Red
      const data2 = createImageData([[0, 255, 0, 255]]) // Green
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      const count = grayscaleDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(1) // Different luminance
    })

    it('should show grayscale output when useGrayscale is true', () => {
      const data1 = createImageData([[128, 128, 128, 255]])
      const data2 = createImageData([[128, 128, 128, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      grayscaleDiff(data1, data2, diffData, { ...defaultOptions, useGrayscale: true }, originalData)

      // Should be grayscale
      expect(diffData[0]).toBe(diffData[1])
      expect(diffData[1]).toBe(diffData[2])
    })
  })

  describe('overlayDiff', () => {
    it('should blend identical pixels', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[100, 100, 100, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      overlayDiff(data1, data2, diffData, { ...defaultOptions, overlayOpacity: 0.5 }, originalData)

      // Should preserve the color for identical pixels
      expect(diffData[0]).toBe(100)
      expect(diffData[1]).toBe(100)
      expect(diffData[2]).toBe(100)
    })

    it('should highlight differences with red overlay', () => {
      const data1 = createImageData([[0, 0, 255, 255]]) // Blue
      const data2 = createImageData([[255, 0, 0, 255]]) // Red
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      overlayDiff(data1, data2, diffData, { ...defaultOptions, overlayOpacity: 0.5 }, originalData)

      // Should have red tint from difference
      expect(diffData[0]).toBeGreaterThan(0) // Has red component
    })

    it('should respect overlay opacity', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[200, 200, 200, 255]])
      const diffData1 = new Uint8ClampedArray(4)
      const diffData2 = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      overlayDiff(data1, data2, diffData1, { ...defaultOptions, overlayOpacity: 0.2 }, originalData)
      overlayDiff(data1, data2, diffData2, { ...defaultOptions, overlayOpacity: 0.8 }, originalData)

      // Higher opacity should show more difference
      expect(diffData2[0]).toBeGreaterThan(diffData1[0])
    })
  })

  describe('heatmapDiff', () => {
    it('should show no difference as blue/cool color', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[100, 100, 100, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      heatmapDiff(data1, data2, diffData, defaultOptions, originalData)

      // No difference should be blue (cool)
      expect(diffData[2]).toBeGreaterThan(diffData[0]) // More blue than red
    })

    it('should show large difference as red/hot color', () => {
      const data1 = createImageData([[0, 0, 0, 255]])
      const data2 = createImageData([[255, 255, 255, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      heatmapDiff(data1, data2, diffData, defaultOptions, originalData)

      // Large difference should be red (hot)
      expect(diffData[0]).toBeGreaterThan(diffData[2]) // More red than blue
    })

    it('should count all different pixels', () => {
      const data1 = createImageData([
        [100, 100, 100, 255],
        [100, 100, 100, 255],
      ])
      const data2 = createImageData([
        [110, 110, 110, 255],
        [100, 100, 100, 255],
      ])
      const diffData = new Uint8ClampedArray(8)
      const originalData = new Uint8ClampedArray(8)

      const count = heatmapDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(1) // One pixel different
    })
  })

  describe('semanticDiff', () => {
    it('should identify content vs styling changes', () => {
      const data1 = createImageData([[0, 0, 0, 255]]) // Black text
      const data2 = createImageData([[50, 50, 50, 255]]) // Dark gray text
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      semanticDiff(data1, data2, diffData, defaultOptions, originalData)

      // Should detect as minor styling change (yellow)
      expect(diffData[0]).toBeGreaterThan(0) // Has red
      expect(diffData[1]).toBeGreaterThan(0) // Has green (yellow = red + green)
    })

    it('should highlight structural changes strongly', () => {
      const data1 = createImageData([[255, 255, 255, 255]]) // White background
      const data2 = createImageData([[0, 0, 0, 255]]) // Black text
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      semanticDiff(data1, data2, diffData, defaultOptions, originalData)

      // Should detect as major structural change (red/magenta)
      expect(diffData[0]).toBeGreaterThan(200) // Strong red for structural change
    })

    it('should count different pixels', () => {
      const data1 = createImageData([
        [255, 255, 255, 255],
        [0, 0, 0, 255],
      ])
      const data2 = createImageData([
        [200, 200, 200, 255],
        [0, 0, 0, 255],
      ])
      const diffData = new Uint8ClampedArray(8)
      const originalData = new Uint8ClampedArray(8)

      const count = semanticDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(1) // One pixel different
    })
  })

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const data1 = new Uint8ClampedArray(0)
      const data2 = new Uint8ClampedArray(0)
      const diffData = new Uint8ClampedArray(0)
      const originalData = new Uint8ClampedArray(0)

      const count = pixelDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(0)
    })

    it('should handle single pixel', () => {
      const data1 = createImageData([[100, 100, 100, 255]])
      const data2 = createImageData([[200, 200, 200, 255]])
      const diffData = new Uint8ClampedArray(4)
      const originalData = new Uint8ClampedArray(4)

      const count = pixelDiff(data1, data2, diffData, defaultOptions, originalData)

      expect(count).toBe(1)
    })

    it('should handle large arrays efficiently', () => {
      const size = 1000 * 1000 // 1 megapixel
      const data1 = new Uint8ClampedArray(size * 4)
      const data2 = new Uint8ClampedArray(size * 4)
      const diffData = new Uint8ClampedArray(size * 4)
      const originalData = new Uint8ClampedArray(size * 4)

      // Fill with identical data
      for (let i = 0; i < size * 4; i++) {
        data1[i] = 128
        data2[i] = 128
      }

      const start = performance.now()
      const count = pixelDiff(data1, data2, diffData, defaultOptions, originalData)
      const duration = performance.now() - start

      expect(count).toBe(0)
      expect(duration).toBeLessThan(500) // Should complete in under 500ms
    })
  })

  describe('all diff modes consistency', () => {
    it('should all return same count for identical images', () => {
      const data1 = createImageData([
        [100, 100, 100, 255],
        [200, 150, 50, 255],
      ])
      const data2 = createImageData([
        [100, 100, 100, 255],
        [200, 150, 50, 255],
      ])

      const counts = [
        pixelDiff(data1, data2, new Uint8ClampedArray(8), defaultOptions, new Uint8ClampedArray(8)),
        thresholdDiff(
          data1,
          data2,
          new Uint8ClampedArray(8),
          defaultOptions,
          new Uint8ClampedArray(8)
        ),
        grayscaleDiff(
          data1,
          data2,
          new Uint8ClampedArray(8),
          defaultOptions,
          new Uint8ClampedArray(8)
        ),
        overlayDiff(
          data1,
          data2,
          new Uint8ClampedArray(8),
          defaultOptions,
          new Uint8ClampedArray(8)
        ),
        heatmapDiff(
          data1,
          data2,
          new Uint8ClampedArray(8),
          defaultOptions,
          new Uint8ClampedArray(8)
        ),
        semanticDiff(
          data1,
          data2,
          new Uint8ClampedArray(8),
          defaultOptions,
          new Uint8ClampedArray(8)
        ),
      ]

      counts.forEach((count) => {
        expect(count).toBe(0)
      })
    })

    it('should all detect differences (though counts may vary by algorithm)', () => {
      const data1 = createImageData([[0, 0, 0, 255]])
      const data2 = createImageData([[255, 255, 255, 255]])

      const counts = [
        pixelDiff(data1, data2, new Uint8ClampedArray(4), defaultOptions, new Uint8ClampedArray(4)),
        thresholdDiff(
          data1,
          data2,
          new Uint8ClampedArray(4),
          defaultOptions,
          new Uint8ClampedArray(4)
        ),
        grayscaleDiff(
          data1,
          data2,
          new Uint8ClampedArray(4),
          defaultOptions,
          new Uint8ClampedArray(4)
        ),
        overlayDiff(
          data1,
          data2,
          new Uint8ClampedArray(4),
          defaultOptions,
          new Uint8ClampedArray(4)
        ),
        heatmapDiff(
          data1,
          data2,
          new Uint8ClampedArray(4),
          defaultOptions,
          new Uint8ClampedArray(4)
        ),
        semanticDiff(
          data1,
          data2,
          new Uint8ClampedArray(4),
          defaultOptions,
          new Uint8ClampedArray(4)
        ),
      ]

      // All should detect at least one difference
      counts.forEach((count) => {
        expect(count).toBeGreaterThan(0)
      })
    })
  })
})
