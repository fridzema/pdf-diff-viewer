import * as pdfjsLib from 'pdfjs-dist'
import { logger } from '~/utils/logger'
import { createTwoFilesPatch } from 'diff'
import { handleError } from '~/utils/errorHandler'

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

// LRU Cache for metadata extraction to avoid re-processing the same files
const MAX_CACHE_SIZE = 20 // Maximum number of entries
const MAX_CACHE_BYTES = 50 * 1024 * 1024 // 50MB max cache size
const metadataCache = new Map<string, PdfMetadata>()
const cacheAccessOrder = new Map<string, number>() // Track access order for LRU
let cacheByteSize = 0 // Track approximate cache size in bytes

/**
 * Estimate the size of a metadata object in bytes
 */
const estimateMetadataSize = (metadata: PdfMetadata): number => {
  // Rough estimate: JSON stringify and count bytes
  return JSON.stringify(metadata).length * 2 // UTF-16 characters
}

/**
 * Evict least recently used entries if cache exceeds limits
 */
const evictLRUEntries = () => {
  // Check if eviction is needed
  while (metadataCache.size > MAX_CACHE_SIZE || cacheByteSize > MAX_CACHE_BYTES) {
    // Find least recently used entry
    let oldestKey: string | null = null
    let oldestTime = Infinity

    cacheAccessOrder.forEach((time, key) => {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    })

    if (oldestKey) {
      const metadata = metadataCache.get(oldestKey)
      if (metadata) {
        cacheByteSize -= estimateMetadataSize(metadata)
      }
      metadataCache.delete(oldestKey)
      cacheAccessOrder.delete(oldestKey)
      logger.log(`Evicted metadata cache entry: ${oldestKey}`)
    } else {
      // Safety break if no key found
      break
    }
  }
}

export const usePdfMetadata = () => {
  /**
   * Generate a cache key for a file based on its characteristics
   */
  const generateCacheKey = (file: File): string => {
    return `${file.name}:${file.size}:${file.lastModified}`
  }

  /**
   * Extract metadata from a PDF file with caching
   */
  const extractMetadata = async (file: File): Promise<PdfMetadata> => {
    // Check cache first
    const cacheKey = generateCacheKey(file)
    const cached = metadataCache.get(cacheKey)
    if (cached) {
      // Update access time for LRU tracking
      cacheAccessOrder.set(cacheKey, Date.now())
      logger.log('Using cached metadata for:', file.name)
      return cached
    }

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
          logger.warn('Could not parse XMP metadata:', e)
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

      const result = {
        info: normalizedInfo,
        xmp: xmpData,
        raw: { info, metadata },
      }

      // Store in cache with LRU tracking
      const entrySize = estimateMetadataSize(result)
      cacheByteSize += entrySize
      metadataCache.set(cacheKey, result)
      cacheAccessOrder.set(cacheKey, Date.now())

      // Evict old entries if cache is too large
      evictLRUEntries()

      logger.log(
        `Cached metadata for: ${file.name} (size: ${(entrySize / 1024).toFixed(1)}KB, total cache: ${(cacheByteSize / 1024).toFixed(1)}KB)`
      )

      return result
    } catch (error) {
      // Use structured error handling
      const appError = handleError(error as Error, {
        file: file.name,
        fileSize: file.size,
        operation: 'metadata extraction',
      })

      logger.error('Error extracting metadata:', appError)
      throw appError
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
