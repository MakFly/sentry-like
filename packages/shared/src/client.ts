export type BreadcrumbCategory = 'ui' | 'navigation' | 'console' | 'http' | 'user'
export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error'

export interface Breadcrumb {
  timestamp: number
  category: BreadcrumbCategory
  type?: string
  level?: BreadcrumbLevel
  message?: string
  data?: Record<string, unknown>
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
  extra?: Record<string, unknown>
  breadcrumbs?: Breadcrumb[]
}

export type TransportErrorCode =
  | 'AUTH_ERROR'
  | 'INGESTION_DISABLED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'

export interface TransportError {
  status: number
  code: TransportErrorCode
  message: string
  retryable: boolean
}

export interface CaptureOptions {
  level?: ErrorEvent['level']
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: User
}
