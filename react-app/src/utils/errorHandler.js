// Centralized error handling utility

/**
 * Get user-friendly error message from various error types
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred'

  // String errors
  if (typeof error === 'string') {
    return error
  }

  // Error objects
  if (error instanceof Error) {
    const message = error.message

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.'
    }

    // Supabase errors
    if (message.includes('JWT') || message.includes('token')) {
      return 'Session expired. Please log in again.'
    }

    if (message.includes('permission') || message.includes('policy')) {
      return 'You don\'t have permission to perform this action.'
    }

    if (message.includes('duplicate') || message.includes('unique')) {
      return 'This item already exists.'
    }

    // Generic error messages
    return message || 'An error occurred. Please try again.'
  }

  // Supabase error format
  if (error.error_description) {
    return error.error_description
  }

  if (error.message) {
    return error.message
  }

  return 'An unknown error occurred'
}

/**
 * Check if error is a network/offline error
 */
export function isOfflineError(error) {
  if (!error) return false

  const message = typeof error === 'string' ? error : error.message || ''
  return (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    message.includes('offline') ||
    !navigator.onLine
  )
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
  if (isOfflineError(error)) return true

  if (!error) return false

  const message = typeof error === 'string' ? error : error.message || ''
  
  // Network timeouts, rate limits, server errors
  return (
    message.includes('timeout') ||
    message.includes('rate limit') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('500')
  )
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break
      }

      // Wait before retrying (exponential backoff)
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}


