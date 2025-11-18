/**
 * Structured Error Handling Utility
 *
 * Provides consistent error handling, logging, and user-friendly error messages
 * across the application.
 */

export enum ErrorType {
  // PDF Processing Errors
  PDF_LOAD_FAILED = 'PDF_LOAD_FAILED',
  PDF_CORRUPTED = 'PDF_CORRUPTED',
  PDF_PASSWORD_PROTECTED = 'PDF_PASSWORD_PROTECTED',
  PDF_TOO_LARGE = 'PDF_TOO_LARGE',
  PDF_INVALID_FORMAT = 'PDF_INVALID_FORMAT',

  // Rendering Errors
  RENDER_FAILED = 'RENDER_FAILED',
  CANVAS_ERROR = 'CANVAS_ERROR',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',

  // Worker Errors
  WORKER_INIT_FAILED = 'WORKER_INIT_FAILED',
  WORKER_TIMEOUT = 'WORKER_TIMEOUT',
  WORKER_CRASH = 'WORKER_CRASH',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',

  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string
  technicalDetails?: string
  originalError?: Error
  timestamp: Date
  context?: Record<string, any>
}

/**
 * User-friendly error messages mapped to error types
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.PDF_LOAD_FAILED]: 'Failed to load PDF file. The file may be corrupted or invalid.',
  [ErrorType.PDF_CORRUPTED]: 'The PDF file appears to be corrupted. Please try a different file.',
  [ErrorType.PDF_PASSWORD_PROTECTED]:
    'This PDF is password-protected. Please remove the password and try again.',
  [ErrorType.PDF_TOO_LARGE]:
    'The PDF file is too large. Please try a smaller file or reduce the page size.',
  [ErrorType.PDF_INVALID_FORMAT]:
    'Invalid PDF format. Please ensure the file is a valid PDF document.',
  [ErrorType.RENDER_FAILED]:
    'Failed to render PDF. Please try refreshing the page or use a different file.',
  [ErrorType.CANVAS_ERROR]: 'Canvas rendering error. Your browser may not support this feature.',
  [ErrorType.OUT_OF_MEMORY]:
    'Not enough memory to process this PDF. Try closing other tabs or using a smaller file.',
  [ErrorType.WORKER_INIT_FAILED]:
    'Failed to initialize background worker. Please refresh the page and try again.',
  [ErrorType.WORKER_TIMEOUT]: 'Processing is taking too long. The file may be too complex.',
  [ErrorType.WORKER_CRASH]: 'Background worker crashed. Please refresh the page and try again.',
  [ErrorType.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
  [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
}

/**
 * Creates a structured error with consistent formatting
 */
export function createAppError(
  type: ErrorType,
  originalError?: Error,
  context?: Record<string, any>
): AppError {
  const userMessage = ERROR_MESSAGES[type]
  const technicalDetails = originalError?.message || 'No additional details'

  const error: AppError = {
    type,
    message: `[${type}] ${technicalDetails}`,
    userMessage,
    technicalDetails,
    originalError,
    timestamp: new Date(),
    context,
  }

  return error
}

/**
 * Detects error type from common error patterns
 */
export function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  const _name = error.name.toLowerCase()

  // PDF.js specific errors
  if (message.includes('password') || message.includes('encrypted')) {
    return ErrorType.PDF_PASSWORD_PROTECTED
  }

  if (message.includes('invalid pdf') || message.includes('not a pdf')) {
    return ErrorType.PDF_INVALID_FORMAT
  }

  if (message.includes('corrupted') || message.includes('malformed')) {
    return ErrorType.PDF_CORRUPTED
  }

  // Memory errors
  if (message.includes('out of memory') || message.includes('memory')) {
    return ErrorType.OUT_OF_MEMORY
  }

  // Worker errors
  if (message.includes('worker')) {
    if (message.includes('timeout')) {
      return ErrorType.WORKER_TIMEOUT
    }
    if (message.includes('crash') || message.includes('terminated')) {
      return ErrorType.WORKER_CRASH
    }
    return ErrorType.WORKER_INIT_FAILED
  }

  // Rendering errors
  if (message.includes('canvas') || message.includes('context')) {
    return ErrorType.CANVAS_ERROR
  }

  if (message.includes('render')) {
    return ErrorType.RENDER_FAILED
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ErrorType.NETWORK_ERROR
  }

  return ErrorType.UNKNOWN_ERROR
}

/**
 * Handles an error with automatic type detection and structured logging
 */
export function handleError(error: Error, context?: Record<string, any>): AppError {
  const errorType = detectErrorType(error)
  const appError = createAppError(errorType, error, context)

  // Log to console with full details in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.group(`🔴 ${appError.type}`)
    // eslint-disable-next-line no-console
    console.error('User Message:', appError.userMessage)
    // eslint-disable-next-line no-console
    console.error('Technical Details:', appError.technicalDetails)
    if (context) {
      // eslint-disable-next-line no-console
      console.error('Context:', context)
    }
    if (error.stack) {
      // eslint-disable-next-line no-console
      console.error('Stack:', error.stack)
    }
    // eslint-disable-next-line no-console
    console.groupEnd()
  } else {
    // Production: minimal logging
    // eslint-disable-next-line no-console
    console.error(`[${appError.type}]`, appError.message)
  }

  return appError
}

/**
 * Checks if a file size exceeds a limit
 */
export function checkFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validates if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Creates a retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const delay = baseDelay * Math.pow(2, attempt)

      // eslint-disable-next-line no-console
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('All retry attempts failed')
}
