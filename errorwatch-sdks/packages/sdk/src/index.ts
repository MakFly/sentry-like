/**
 * @errorwatch/sdk
 * Universal error monitoring SDK for browser, React, and Vue applications
 */

import type { SDKConfig, User, CaptureOptions, Breadcrumb } from './types.js'
import { Client } from './client.js'
import { setupBrowserErrorHandlers, removeBrowserErrorHandlers } from './integrations/browser.js'

// Global client singleton
let globalClient: Client | null = null

/**
 * Initialize ErrorWatch SDK
 *
 * @example
 * // Basic setup
 * init({
 *   dsn: 'http://localhost:3333',
 *   apiKey: 'ew_live_...',
 *   environment: 'production'
 * })
 *
 * @example
 * // With replay and transport callbacks
 * init({
 *   dsn: 'http://localhost:3333',
 *   apiKey: 'ew_live_...',
 *   replay: {
 *     enabled: true,
 *     replaysOnErrorSampleRate: 1.0
 *   },
 *   transport: {
 *     onError: (err) => {
 *       if (err.code === 'INGESTION_DISABLED') {
 *         console.log('Event ingestion is disabled for this project')
 *       }
 *     }
 *   }
 * })
 */
export function init(config: SDKConfig): Client {
  if (globalClient) {
    console.warn('ErrorWatch: SDK already initialized. Call close() first to reinitialize.')
    return globalClient
  }

  globalClient = new Client(config)

  // Setup browser error handlers automatically
  if (typeof window !== 'undefined') {
    setupBrowserErrorHandlers(globalClient)
  }

  return globalClient
}

/**
 * Capture an exception
 *
 * @example
 * try {
 *   riskyOperation()
 * } catch (e) {
 *   captureException(e)
 * }
 */
export function captureException(error: Error | unknown, options?: CaptureOptions): void {
  if (!globalClient) {
    console.warn('ErrorWatch: SDK not initialized. Call init() first.')
    return
  }
  globalClient.captureException(error, options)
}

/**
 * Capture a message
 *
 * @example
 * captureMessage('User completed checkout', { level: 'info' })
 */
export function captureMessage(message: string, options?: CaptureOptions): void {
  if (!globalClient) {
    console.warn('ErrorWatch: SDK not initialized. Call init() first.')
    return
  }
  globalClient.captureMessage(message, options)
}

/**
 * Set the current user context
 *
 * @example
 * setUser({ id: '123', email: 'user@example.com' })
 */
export function setUser(user: User | null): void {
  if (!globalClient) {
    console.warn('ErrorWatch: SDK not initialized. Call init() first.')
    return
  }
  globalClient.setUser(user)
}

/**
 * Add a breadcrumb
 *
 * @example
 * addBreadcrumb({
 *   category: 'user',
 *   message: 'User clicked checkout button',
 *   level: 'info'
 * })
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  if (!globalClient) {
    console.warn('ErrorWatch: SDK not initialized. Call init() first.')
    return
  }
  globalClient.addBreadcrumb(breadcrumb)
}

/**
 * Get the current replay session ID
 */
export function getReplaySessionId(): string | null {
  return globalClient?.getReplaySessionId() ?? null
}

/**
 * Flush pending events
 */
export async function flush(): Promise<void> {
  if (globalClient) {
    await globalClient.flush()
  }
}

/**
 * Close the SDK and cleanup resources
 */
export function close(): void {
  if (globalClient) {
    removeBrowserErrorHandlers()
    globalClient.destroy()
    globalClient = null
  }
}

/**
 * Get the global client instance
 */
export function getClient(): Client | null {
  return globalClient
}

// Re-export types
export type {
  SDKConfig,
  User,
  CaptureOptions,
  Breadcrumb,
  BreadcrumbCategory,
  BreadcrumbLevel,
  BreadcrumbConfig,
  ErrorEvent,
  StackFrame,
  RequestContext,
  TransportConfig,
  TransportError,
  TransportErrorCode,
  ReplayConfig,
  ErrorWatchClient,
} from './types.js'

// Re-export classes for advanced usage
export { Client } from './client.js'
export { BreadcrumbManager, addBreadcrumb as addGlobalBreadcrumb } from './breadcrumbs/index.js'
export { ReplayCapture, type ReplayMode, type SessionInfo } from './replay/index.js'
