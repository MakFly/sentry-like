// Breadcrumb types
export type BreadcrumbCategory = 'ui' | 'navigation' | 'console' | 'http' | 'user'
export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error'

export interface Breadcrumb {
  timestamp: number
  category: BreadcrumbCategory
  type?: string
  level?: BreadcrumbLevel
  message?: string
  data?: Record<string, any>
}

// SDK Configuration
export interface SDKConfig {
  dsn?: string              // Alternative to endpoint
  endpoint?: string         // API endpoint (e.g., 'http://localhost:3333')
  apiKey: string
  environment?: string
  release?: string
  userId?: string | (() => string)
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null
  maxQueueSize?: number
  flushInterval?: number

  // Replay configuration
  replay?: ReplayConfig & { enabled?: boolean }

  // Breadcrumb configuration
  breadcrumbs?: BreadcrumbConfig & { enabled?: boolean }

  // Transport configuration
  transport?: TransportConfig
}

export interface ReplayConfig {
  enabled?: boolean                   // Enable/disable replay (default: true)
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

// Error Event
export interface ErrorEvent {
  fingerprint: string
  message: string
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  timestamp: string
  environment: string
  release?: string
  user?: User
  request?: RequestContext
  stacktrace?: StackFrame[]
  tags?: Record<string, string>
  extra?: Record<string, any>
  breadcrumbs?: Breadcrumb[]
}

export interface User {
  id?: string
  email?: string
  username?: string
  ipAddress?: string
}

export interface RequestContext {
  method?: string
  url?: string
  headers?: Record<string, string>
  userAgent?: string
  clientIp?: string
}

export interface StackFrame {
  filename?: string
  function?: string
  lineno?: number
  colno?: number
  preContext?: string[]
  context?: string
  postContext?: string[]
}

export interface CaptureOptions {
  level?: ErrorEvent['level']
  tags?: Record<string, string>
  extra?: Record<string, any>
  user?: User
}

// Transport error types
export type TransportErrorCode =
  | 'AUTH_ERROR'           // 401 - Invalid API key
  | 'INGESTION_DISABLED'   // 403 - Project ingestion disabled
  | 'RATE_LIMITED'         // 429 - Too many requests
  | 'SERVER_ERROR'         // 5xx - Server error
  | 'NETWORK_ERROR'        // Network failure

export interface TransportError {
  status: number
  code: TransportErrorCode
  message: string
  retryable: boolean
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
