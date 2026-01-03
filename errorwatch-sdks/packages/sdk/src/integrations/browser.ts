/**
 * Browser Integration
 * Automatically captures uncaught errors and unhandled promise rejections
 */

import type { ErrorWatchClient } from '../types.js'

let originalOnError: OnErrorEventHandler | null = null
let originalOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null

export function setupBrowserErrorHandlers(client: ErrorWatchClient): void {
  if (typeof window === 'undefined') return

  // Store originals for cleanup
  originalOnError = window.onerror
  originalOnUnhandledRejection = window.onunhandledrejection

  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    client.captureException(error || new Error(String(message)), {
      extra: {
        source,
        lineno,
        colno,
      }
    })

    // Call original handler if exists
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error)
    }
    return false
  }

  // Unhandled promise rejection handler
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))

    client.captureException(error, {
      extra: {
        type: 'unhandledrejection',
        reason: String(event.reason),
      }
    })

    // Call original handler if exists
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection.call(window, event)
    }
  }
}

export function removeBrowserErrorHandlers(): void {
  if (typeof window === 'undefined') return

  if (originalOnError !== null) {
    window.onerror = originalOnError
    originalOnError = null
  }

  if (originalOnUnhandledRejection !== null) {
    window.onunhandledrejection = originalOnUnhandledRejection
    originalOnUnhandledRejection = null
  }
}
