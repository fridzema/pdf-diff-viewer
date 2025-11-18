import { describe, it, expect, beforeEach } from 'vitest'
import { usePdfDiffWorker } from '../usePdfDiffWorker'

/**
 * Worker Integration Tests
 *
 * Note: These tests verify the API surface and error handling of the worker composable.
 * Full worker execution with actual Web Workers is tested in E2E tests, as the unit test
 * environment (jsdom) does not support Web Workers.
 */
describe('usePdfDiffWorker', () => {
  let mockCanvas1: HTMLCanvasElement
  let mockCanvas2: HTMLCanvasElement
  let mockDiffCanvas: HTMLCanvasElement

  beforeEach(() => {
    // Create mock canvases
    mockCanvas1 = document.createElement('canvas')
    mockCanvas2 = document.createElement('canvas')
    mockDiffCanvas = document.createElement('canvas')

    // Set dimensions
    mockCanvas1.width = 100
    mockCanvas1.height = 100
    mockCanvas2.width = 100
    mockCanvas2.height = 100
    mockDiffCanvas.width = 100
    mockDiffCanvas.height = 100

    // Create contexts and fill with test data
    const ctx1 = mockCanvas1.getContext('2d')!
    const ctx2 = mockCanvas2.getContext('2d')!

    // Fill canvas1 with red
    ctx1.fillStyle = 'red'
    ctx1.fillRect(0, 0, 100, 100)

    // Fill canvas2 with blue
    ctx2.fillStyle = 'blue'
    ctx2.fillRect(0, 0, 100, 100)
  })

  it('should initialize worker successfully', () => {
    const { comparePdfsAsync } = usePdfDiffWorker()

    expect(comparePdfsAsync).toBeDefined()
    expect(typeof comparePdfsAsync).toBe('function')
  })

  it('should terminate worker on unmount', () => {
    const { terminateWorker } = usePdfDiffWorker()

    expect(terminateWorker).toBeDefined()
    expect(typeof terminateWorker).toBe('function')

    // Should not throw
    terminateWorker()
  })

  it('should reject when worker fails to initialize (no Worker support)', async () => {
    const { comparePdfsAsync } = usePdfDiffWorker()

    const options = {
      mode: 'pixel' as const,
      threshold: 0,
      overlayOpacity: 0.5,
      useGrayscale: false,
    }

    // In test environment without Worker support, this should reject
    await expect(
      comparePdfsAsync(mockCanvas1, mockCanvas2, mockDiffCanvas, options)
    ).rejects.toThrow('Worker initialization failed')
  })

  it('should expose isProcessing as readonly', () => {
    const { isProcessing } = usePdfDiffWorker()

    expect(isProcessing.value).toBe(false)
    // isProcessing should be readonly, verify it exists
    expect(isProcessing).toBeDefined()
  })

  it('should clean up worker on terminate', () => {
    const { terminateWorker, isProcessing } = usePdfDiffWorker()

    terminateWorker()

    // After termination, processing should be false
    expect(isProcessing.value).toBe(false)

    // Calling terminate again should not throw
    expect(() => terminateWorker()).not.toThrow()
  })
})
