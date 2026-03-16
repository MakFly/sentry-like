export type {
  Breadcrumb,
  BreadcrumbCategory,
  BreadcrumbLevel,
  User,
  RequestContext,
  StackFrame,
  ErrorEvent,
  TransportErrorCode,
  TransportError,
  CaptureOptions,
} from '@errorwatch/shared/client'

import type { ErrorEvent, User, Breadcrumb, CaptureOptions, TransportError } from '@errorwatch/shared/client'

// SDK Configuration
export interface SDKConfig {
  dsn?: string              // Alternative to endpoint
  endpoint?: string         // API endpoint (e.g., 'http://localhost:3333')
  apiKey: string
  environment?: string
  release?: string
  debug?: boolean           // Enable verbose console logging (default: false)
  userId?: string | (() => string)
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null
  maxQueueSize?: number
  flushInterval?: number
  sampleRate?: number          // 0.0 to 1.0, percentage of events to send (default: 1.0)

  // Replay configuration
  replay?: ReplayConfig & { enabled?: boolean }

  // Breadcrumb configuration
  breadcrumbs?: BreadcrumbConfig & { enabled?: boolean }

  // Transport configuration
  transport?: TransportConfig
}

export interface ReplayConfig {
  enabled?: boolean                   // Enable/disable replay (default: true)
  debug?: boolean                     // Enable verbose console logging (default: false)
  replaysSessionSampleRate?: number   // Session mode sampling (default: 0)
  replaysOnErrorSampleRate?: number   // Buffer mode sampling (default: 1.0)
  sampleRate?: number                 // Deprecated: use replaysSessionSampleRate
  maskAllInputs?: boolean
  maskTextSelector?: string
  blockSelector?: string
  maxReplayDuration?: number
  flushInterval?: number
  postErrorBuffer?: number
}

export interface BreadcrumbConfig {
  maxBreadcrumbs?: number
  enableConsoleCapture?: boolean
  enableClickCapture?: boolean
  enableNavigationCapture?: boolean
  enableFetchCapture?: boolean
  enableXHRCapture?: boolean
}

export interface TransportConfig {
  maxRetries?: number           // default: 3
  retryDelay?: number           // default: 1000ms (doubles each retry)
  onError?: (error: TransportError) => void
  onSuccess?: () => void
}

// SDK Client interface
export interface ErrorWatchClient {
  captureException(error: Error | unknown, options?: CaptureOptions): void
  captureMessage(message: string, options?: CaptureOptions): void
  setUser(user: User | null): void
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void
  getReplaySessionId(): string | null
  flush(): Promise<void>
  destroy(): void
}
