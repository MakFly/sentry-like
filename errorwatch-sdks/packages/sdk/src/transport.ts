import { z } from 'zod'
import type { ErrorEvent, TransportConfig, TransportError, TransportErrorCode } from './types.js'

// Error category mapping for HTTP status codes
const ERROR_CATEGORIES: Record<number, { code: TransportErrorCode; retryable: boolean }> = {
  401: { code: 'AUTH_ERROR', retryable: false },
  403: { code: 'INGESTION_DISABLED', retryable: false },
  429: { code: 'RATE_LIMITED', retryable: true },
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getErrorCategory(status: number): { code: TransportErrorCode; retryable: boolean } {
  if (ERROR_CATEGORIES[status]) {
    return ERROR_CATEGORIES[status]
  }
  if (status >= 500) {
    return { code: 'SERVER_ERROR', retryable: true }
  }
  return { code: 'SERVER_ERROR', retryable: false }
}

// Internal schema for SDK validation
const EventSchema = z.object({
  fingerprint: z.string(),
  message: z.string(),
  level: z.enum(['fatal', 'error', 'warning', 'info', 'debug']),
  timestamp: z.string(),
  environment: z.string(),
  release: z.string().optional(),
  user: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    ipAddress: z.string().optional()
  }).optional(),
  request: z.object({
    method: z.string().optional(),
    url: z.string().optional(),
    headers: z.record(z.string()).optional(),
    userAgent: z.string().optional(),
    clientIp: z.string().optional()
  }).optional(),
  stacktrace: z.array(z.object({
    filename: z.string().optional(),
    function: z.string().optional(),
    lineno: z.number().optional(),
    colno: z.number().optional()
  })).optional(),
  tags: z.record(z.string()).optional(),
  extra: z.record(z.any()).optional(),
  breadcrumbs: z.array(z.any()).optional()
})

function transformEventForServer(event: z.infer<typeof EventSchema>) {
  const firstFrame = event.stacktrace?.[0]
  const file = firstFrame?.filename || 'unknown'
  const line = firstFrame?.lineno || 1

  const stack = event.stacktrace
    ? event.stacktrace
        .map(frame => {
          const fn = frame.function || '<anonymous>'
          const loc = frame.filename ? `${frame.filename}:${frame.lineno || 0}:${frame.colno || 0}` : ''
          return `    at ${fn}${loc ? ` (${loc})` : ''}`
        })
        .join('\n')
    : 'No stack trace available'

  return {
    message: event.message,
    file,
    line,
    stack: `${event.message}\n${stack}`,
    env: event.environment,
    url: event.request?.url || null,
    level: event.level,
    created_at: Date.now(),
    breadcrumbs: event.breadcrumbs,
    session_id: event.extra?.sessionId as string | undefined,
    release: event.release || null
  }
}

export async function sendEvent(
  endpoint: string,
  apiKey: string,
  event: ErrorEvent,
  transportConfig?: TransportConfig
): Promise<void> {
  const maxRetries = transportConfig?.maxRetries ?? 3
  const baseDelay = transportConfig?.retryDelay ?? 1000
  let lastError: TransportError | null = null

  try {
    const validatedEvent = EventSchema.parse(event)
    const serverPayload = transformEventForServer(validatedEvent)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${endpoint}/api/v1/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify(serverPayload)
        })

        if (response.ok) {
          transportConfig?.onSuccess?.()
          return
        }

        const category = getErrorCategory(response.status)
        let errorMessage = response.statusText
        try {
          const body = await response.json()
          errorMessage = body.message || body.error || response.statusText
        } catch {}

        lastError = {
          status: response.status,
          code: category.code,
          message: errorMessage,
          retryable: category.retryable
        }

        if (!lastError.retryable) {
          break
        }

        if (attempt < maxRetries) {
          await sleep(baseDelay * Math.pow(2, attempt))
        }

      } catch (networkError) {
        lastError = {
          status: 0,
          code: 'NETWORK_ERROR',
          message: networkError instanceof Error ? networkError.message : 'Network error',
          retryable: true
        }

        if (attempt < maxRetries) {
          await sleep(baseDelay * Math.pow(2, attempt))
        }
      }
    }

    if (lastError) {
      if (transportConfig?.onError) {
        transportConfig.onError(lastError)
      } else {
        console.error(`ErrorWatch: ${lastError.code} - ${lastError.message}`)
      }
    }

  } catch (error) {
    console.error('ErrorWatch: Failed to send event:', error)
  }
}

export async function sendErrorWithReplay(
  endpoint: string,
  apiKey: string,
  sessionId: string,
  events: string | null,
  error: {
    message: string
    file?: string
    line?: number
    stack?: string
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  },
  url?: string,
  userAgent?: string
): Promise<void> {
  try {
    const response = await fetch(`${endpoint}/api/v1/replay/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        sessionId,
        events,
        error: {
          message: error.message,
          file: error.file,
          line: error.line,
          stack: error.stack,
          level: error.level || 'error'
        },
        url,
        userAgent,
        timestamp: Date.now()
      })
    })

    if (!response.ok) {
      console.error(`ErrorWatch (replay): ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('ErrorWatch: Failed to send error with replay:', error)
  }
}

export async function sendReplayEvents(
  endpoint: string,
  apiKey: string,
  sessionId: string,
  events: string,
  eventCount?: number
): Promise<void> {
  try {
    const response = await fetch(`${endpoint}/api/v1/replay/session/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        sessionId,
        events,
        timestamp: Date.now(),
        count: eventCount
      })
    })

    if (!response.ok) {
      console.error(`ErrorWatch (replay events): ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('ErrorWatch: Failed to send replay events:', error)
  }
}

export async function startReplaySession(
  endpoint: string,
  apiKey: string,
  sessionInfo: {
    sessionId: string
    url?: string
    userAgent?: string
    deviceType?: 'desktop' | 'mobile' | 'tablet'
    browser?: string
    os?: string
    userId?: string
  }
): Promise<void> {
  try {
    const response = await fetch(`${endpoint}/api/v1/replay/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(sessionInfo)
    })

    if (!response.ok) {
      console.error(`ErrorWatch (start session): ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('ErrorWatch: Failed to start replay session:', error)
  }
}

export class EventQueue {
  private queue: any[] = []
  private timer: any = null
  private maxQueueSize: number
  private flushInterval: number

  constructor(maxQueueSize = 30, flushInterval = 5000) {
    this.maxQueueSize = maxQueueSize
    this.flushInterval = flushInterval
  }

  add(event: any, sender: (event: any) => void): void {
    this.queue.push(event)

    if (this.queue.length >= this.maxQueueSize) {
      this.flush(sender)
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(sender), this.flushInterval)
    }
  }

  flush(sender: (event: any) => void): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const events = [...this.queue]
    this.queue = []

    events.forEach(event => sender(event))
  }
}
