import * as pdfjsLib from 'pdfjs-dist'
import { createTwoFilesPatch } from 'diff'

export interface PdfMetadataInfo {
  Title?: string
  Author?: string
  Subject?: string
  Keywords?: string
  Creator?: string
  Producer?: string
  CreationDate?: string
  ModDate?: string
  PDFFormatVersion?: string
  IsAcroFormPresent?: boolean
  IsLinearized?: boolean
  [key: string]: any
}

export interface PdfMetadata {
  info: PdfMetadataInfo
  xmp: Record<string, any>
  raw: {
    info: any
    metadata: any
  }
}

export interface MetadataComparison {
  differences: string[]
  leftOnly: string[]
  rightOnly: string[]
  changed: Array<{
    field: string
    left: any
    right: any
  }>
  identical: string[]
}

export const usePdfMetadata = () => {
  /**
   * Extract metadata from a PDF file
   */
  const extractMetadata = async (file: File): Promise<PdfMetadata> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      const { info, metadata } = await pdf.getMetadata()

      // Parse XMP metadata if available
      const xmpData: Record<string, any> = {}
      if (metadata) {
        try {
          const metadataObj = metadata.getAll()
          Object.assign(xmpData, metadataObj)
        } catch (e) {
          console.warn('Could not parse XMP metadata:', e)
        }
      }

      // Normalize date strings
      const normalizedInfo: PdfMetadataInfo = {}
      if (info) {
        Object.keys(info).forEach((key) => {
          const value = info[key]
          if (key.includes('Date') && value) {
            normalizedInfo[key] = normalizeDate(value)
          } else {
            normalizedInfo[key] = value
          }
        })
      }

      return {
        info: normalizedInfo,
        xmp: xmpData,
        raw: { info, metadata },
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
      throw error
    }
  }

  /**
   * Normalize PDF date string to ISO format
   */
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ''

    // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
    if (dateStr.startsWith('D:')) {
      const year = dateStr.substring(2, 6)
      const month = dateStr.substring(6, 8)
      const day = dateStr.substring(8, 10)
      const hour = dateStr.substring(10, 12) || '00'
      const minute = dateStr.substring(12, 14) || '00'
      const second = dateStr.substring(14, 16) || '00'

      try {
        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
        return date.toISOString()
      } catch {
        return dateStr
      }
    }

    return dateStr
  }

  /**
   * Format metadata as readable text for diff comparison
   */
  const formatMetadataForDiff = (metadata: PdfMetadata | null, label: string): string => {
    if (!metadata) return `${label}\n(No metadata available)`

    const lines: string[] = [`${label}`, '']

    // Info section
    if (metadata.info && Object.keys(metadata.info).length > 0) {
      lines.push('[Document Information]')
      Object.entries(metadata.info)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            lines.push(`${key}: ${formatValue(value)}`)
          }
        })
      lines.push('')
    }

    // XMP section
    if (metadata.xmp && Object.keys(metadata.xmp).length > 0) {
      lines.push('[XMP Metadata]')
      Object.entries(metadata.xmp)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            lines.push(`${key}: ${formatValue(value)}`)
          }
        })
    }

    return lines.join('\n')
  }

  /**
   * Format a metadata value for display
   */
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(not set)'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  /**
   * Compare two metadata objects
   */
  const compareMetadata = (
    left: PdfMetadata | null,
    right: PdfMetadata | null
  ): MetadataComparison => {
    const result: MetadataComparison = {
      differences: [],
      leftOnly: [],
      rightOnly: [],
      changed: [],
      identical: [],
    }

    if (!left || !right) {
      return result
    }

    // Combine all metadata fields
    const allFields = new Set<string>()

    // Add info fields
    if (left.info) Object.keys(left.info).forEach((k) => allFields.add(`info.${k}`))
    if (right.info) Object.keys(right.info).forEach((k) => allFields.add(`info.${k}`))

    // Add XMP fields
    if (left.xmp) Object.keys(left.xmp).forEach((k) => allFields.add(`xmp.${k}`))
    if (right.xmp) Object.keys(right.xmp).forEach((k) => allFields.add(`xmp.${k}`))

    // Compare each field
    allFields.forEach((field) => {
      const [section, key] = field.split('.')
      const leftValue = section === 'info' ? left.info?.[key] : left.xmp?.[key]
      const rightValue = section === 'info' ? right.info?.[key] : right.xmp?.[key]

      const leftExists = leftValue !== undefined && leftValue !== null
      const rightExists = rightValue !== undefined && rightValue !== null

      if (!leftExists && !rightExists) {
        // Both missing, skip
        return
      }

      if (leftExists && !rightExists) {
        result.leftOnly.push(field)
        result.differences.push(field)
      } else if (!leftExists && rightExists) {
        result.rightOnly.push(field)
        result.differences.push(field)
      } else if (String(leftValue) !== String(rightValue)) {
        result.changed.push({ field, left: leftValue, right: rightValue })
        result.differences.push(field)
      } else {
        result.identical.push(field)
      }
    })

    return result
  }

  /**
   * Create a unified diff patch for metadata
   */
  const createMetadataDiff = (
    leftMetadata: PdfMetadata | null,
    rightMetadata: PdfMetadata | null,
    leftFileName = 'PDF 1',
    rightFileName = 'PDF 2'
  ): string => {
    const leftText = formatMetadataForDiff(leftMetadata, leftFileName)
    const rightText = formatMetadataForDiff(rightMetadata, rightFileName)

    return createTwoFilesPatch(
      leftFileName,
      rightFileName,
      leftText,
      rightText,
      'Original',
      'Modified'
    )
  }

  return {
    extractMetadata,
    normalizeDate,
    formatMetadataForDiff,
    formatValue,
    compareMetadata,
    createMetadataDiff,
  }
}
