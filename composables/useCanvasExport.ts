import type { DiffMode } from './usePdfDiff'

export type ExportFormat = 'png' | 'jpeg'

export interface ExportOptions {
  format: ExportFormat
  quality: number // 0-1 for JPEG quality
  includeMetadata: boolean
  filename?: string
}

export interface ExportMetadata {
  timestamp: string
  mode: DiffMode
  differenceCount: number
  totalPixels: number
  percentDiff: number
  threshold?: number
  overlayOpacity?: number
}

/**
 * Composable for exporting canvas to image files
 * Supports PNG and JPEG formats with metadata embedding
 */
export function useCanvasExport() {
  /**
   * Generate a default filename based on current timestamp and mode
   */
  const generateFilename = (mode: DiffMode, format: ExportFormat): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    return `pdf-diff-${mode}-${timestamp}.${format}`
  }

  /**
   * Export canvas to image file
   * @param canvas - Canvas element to export
   * @param options - Export options (format, quality, metadata)
   * @param metadata - Optional metadata to embed in filename
   */
  const exportCanvas = async (
    canvas: HTMLCanvasElement,
    options: ExportOptions,
    metadata?: ExportMetadata
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg'
        const quality = options.format === 'jpeg' ? options.quality : undefined

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'))
              return
            }

            // Generate filename
            let filename = options.filename
            if (!filename) {
              if (metadata) {
                filename = generateFilename(metadata.mode, options.format)
              } else {
                filename = `pdf-diff-export-${Date.now()}.${options.format}`
              }
            }

            // Create download link
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Clean up
            setTimeout(() => {
              URL.revokeObjectURL(url)
            }, 100)

            resolve()
          },
          mimeType,
          quality
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Export canvas with metadata overlay
   * Creates a new canvas with metadata text rendered on top
   */
  const exportCanvasWithMetadata = async (
    canvas: HTMLCanvasElement,
    options: ExportOptions,
    metadata: ExportMetadata
  ): Promise<void> => {
    // Create a new canvas with extra space for metadata
    const metadataHeight = 120
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = canvas.width
    compositeCanvas.height = canvas.height + metadataHeight

    const ctx = compositeCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Draw white background for metadata area
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height)

    // Draw the diff canvas
    ctx.drawImage(canvas, 0, 0)

    // Draw metadata
    ctx.fillStyle = '#000000'
    ctx.font = '14px monospace'

    const padding = 10
    let yOffset = canvas.height + padding + 16

    // Format metadata text
    const metadataText = [
      `PDF Diff Export - ${metadata.mode.toUpperCase()} mode`,
      `Timestamp: ${metadata.timestamp}`,
      `Differences: ${metadata.differenceCount.toLocaleString()} / ${metadata.totalPixels.toLocaleString()} pixels (${metadata.percentDiff.toFixed(2)}%)`,
    ]

    if (metadata.threshold !== undefined) {
      metadataText.push(`Threshold: ${metadata.threshold}`)
    }

    if (metadata.overlayOpacity !== undefined) {
      metadataText.push(`Overlay Opacity: ${(metadata.overlayOpacity * 100).toFixed(0)}%`)
    }

    // Render each line
    metadataText.forEach((line) => {
      ctx.fillText(line, padding, yOffset)
      yOffset += 20
    })

    // Export the canvas with metadata
    return exportCanvas(compositeCanvas, options)
  }

  /**
   * Copy canvas to clipboard (as PNG)
   */
  const copyCanvasToClipboard = async (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'))
          return
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ])
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 'image/png')
    })
  }

  return {
    exportCanvas,
    exportCanvasWithMetadata,
    copyCanvasToClipboard,
    generateFilename,
  }
}
