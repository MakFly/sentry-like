/**
 * ErrorWatch Client
 * Core client that handles error capture, replay, and breadcrumbs
 */

import type {
  SDKConfig,
  ErrorEvent,
  User,
  StackFrame,
  RequestContext,
  CaptureOptions,
  Breadcrumb,
  ErrorWatchClient,
} from './types.js'
import { sendEvent, sendErrorWithReplay, sendReplayEvents, startReplaySession, EventQueue } from './transport.js'
import { BreadcrumbManager } from './breadcrumbs/index.js'
import { ReplayCapture, type ReplayMode } from './replay/index.js'

function generateFingerprint(error: Error | unknown, context?: string): string {
  if (error instanceof Error) {
    const stack = error.stack || ''
    const name = error.name
    const message = error.message
    const normalizedStack = stack.split('\n')[0] || ''
    return `${name}:${message}:${normalizedStack}:${context || ''}`
  }
  return `${String(error)}:${context || ''}`
}

function parseStacktrace(error: Error): StackFrame[] {
  const stack = error.stack || ''
  const lines = stack.split('\n').slice(1)

  return lines.map(line => {
    const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/) ||
                   line.match(/at (.+?):(\d+):(\d+)/)

    if (match) {
      return {
        filename: match[2] || match[1],
        function: match[1] || undefined,
        lineno: match[3] ? parseInt(match[3]) : undefined,
        colno: match[4] ? parseInt(match[4]) : undefined
      }
    }
    return { function: line.trim() }
  }).filter(Boolean)
}

function extractRequestContext(): RequestContext | undefined {
  if (typeof window === 'undefined') return undefined

  return {
    method: undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    headers: { 'user-agent': navigator.userAgent }
  }
}

export class Client implements ErrorWatchClient {
  private config: SDKConfig & { endpoint: string }
  private debug: boolean
  private queue: EventQueue
  private currentUser: User | null = null
  private breadcrumbManager: BreadcrumbManager
  private replayCapture: ReplayCapture | null = null
  private sessionStarted = false

  private pendingPostErrorResolve: (() => void) | null = null
  private beforeUnloadHandler: (() => void) | null = null
  private isWaitingForPostErrorBuffer = false
  private pendingErrors: Array<{ error: Error | unknown; event: ErrorEvent }> = []

  // Dedup: throttle by fingerprint (LRU cache)
  private dedupCache = new Map<string, number>()
  private dedupCleanupInterval: ReturnType<typeof setInterval> | null = null
  private static readonly DEDUP_WINDOW_MS = 5000
  private static readonly DEDUP_MAX_ENTRIES = 1000
  private static readonly DEDUP_CLEANUP_INTERVAL_MS = 30000

  constructor(config: SDKConfig) {
    // Support both dsn and endpoint
    const endpoint = config.endpoint || config.dsn || 'http://localhost:3333'

    this.debug = config.debug ?? false

    this.config = {
      endpoint,
      environment: config.environment || 'production',
      maxQueueSize: config.maxQueueSize || 30,
      flushInterval: config.flushInterval || 5000,
      ...config,
    }

    this.queue = new EventQueue(this.config.maxQueueSize, this.config.flushInterval)

    // Initialize breadcrumb manager
    this.breadcrumbManager = new BreadcrumbManager(config.breadcrumbs)
    if (config.breadcrumbs?.enabled !== false) {
      this.breadcrumbManager.init()
    }

    // Initialize replay capture if enabled
    if (config.replay?.enabled !== false && typeof window !== 'undefined') {
      this.initReplay(config.replay)
    }

    // Setup beforeunload handler
    if (typeof window !== 'undefined') {
      this.beforeUnloadHandler = () => {
        if (this.pendingPostErrorResolve) {
          this.pendingPostErrorResolve()
        }
      }
      window.addEventListener('beforeunload', this.beforeUnloadHandler)
    }

    // Setup dedup cache cleanup
    this.dedupCleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, timestamp] of this.dedupCache) {
        if (now - timestamp > 60000) {
          this.dedupCache.delete(key)
        }
      }
    }, Client.DEDUP_CLEANUP_INTERVAL_MS)
  }

  private initReplay(replayConfig?: SDKConfig['replay']): void {
    this.replayCapture = new ReplayCapture({
      ...replayConfig,
      debug: this.debug,
      replaysSessionSampleRate: replayConfig?.replaysSessionSampleRate ?? 0,
      replaysOnErrorSampleRate: replayConfig?.replaysOnErrorSampleRate ?? 1.0,
    })

    this.replayCapture.start()

    if (this.replayCapture.getMode() === 'session') {
      this.replayCapture.onFlush(async (events, sessionId) => {
        if (!this.sessionStarted && this.replayCapture) {
          const sessionInfo = this.replayCapture.getSessionInfo()
          if (sessionInfo) {
            await startReplaySession(this.config.endpoint, this.config.apiKey, {
              sessionId: sessionInfo.id,
              url: sessionInfo.url,
              userAgent: sessionInfo.userAgent,
              deviceType: sessionInfo.deviceType,
              browser: sessionInfo.browser,
              os: sessionInfo.os,
            })
            this.sessionStarted = true
          }
        }

        await sendReplayEvents(this.config.endpoint, this.config.apiKey, sessionId, events)
      })
    }
  }

  captureException(error: Error | unknown, options?: CaptureOptions): void {
    // Dedup: throttle identical errors within 5s window
    const dedupKey = generateFingerprint(error)
    const now = Date.now()
    const lastSeen = this.dedupCache.get(dedupKey)
    if (lastSeen !== undefined && now - lastSeen < Client.DEDUP_WINDOW_MS) {
      if (this.debug) console.debug('ErrorWatch: Duplicate error throttled', dedupKey)
      return
    }
    this.dedupCache.set(dedupKey, now)
    // Evict oldest entries if cache exceeds max size
    if (this.dedupCache.size > Client.DEDUP_MAX_ENTRIES) {
      const firstKey = this.dedupCache.keys().next().value
      if (firstKey !== undefined) this.dedupCache.delete(firstKey)
    }

    // Apply sample rate
    const sampleRate = this.config.sampleRate ?? 1.0
    if (sampleRate < 1.0 && Math.random() >= sampleRate) {
      if (this.debug) console.debug('ErrorWatch: Event dropped by sampleRate')
      return
    }

    const event = this.buildEvent(error, options)

    if (this.config.beforeSend) {
      const processed = this.config.beforeSend(event)
      if (!processed) return
      event.fingerprint = processed.fingerprint
      event.tags = processed.tags
      event.extra = processed.extra
    }

    const mode = this.replayCapture?.getMode()
    const isRecording = this.replayCapture?.isRecording()
    const isCriticalError = event.level === 'error' || event.level === 'fatal'

    if (isRecording && isCriticalError && (mode === 'buffer' || mode === 'session')) {
      this.captureWithReplay(error, event)
    } else {
      this.queue.add(event, (evt) =>
        sendEvent(this.config.endpoint, this.config.apiKey, evt, this.config.transport)
      )
    }
  }

  private async captureWithReplay(error: Error | unknown, event: ErrorEvent): Promise<void> {
    if (!this.replayCapture) return

    const isError = error instanceof Error
    const sessionInfo = this.replayCapture.getSessionInfo()
    const sessionId = this.replayCapture.getSessionId()
    const firstFrame = event.stacktrace?.[0]

    if (this.isWaitingForPostErrorBuffer) {
      this.pendingErrors.push({ error, event })
      return
    }

    const postErrorBuffer = this.replayCapture.getPostErrorBuffer()
    if (postErrorBuffer > 0 && !this.replayCapture.isSessionUploaded()) {
      this.isWaitingForPostErrorBuffer = true
      await new Promise<void>(resolve => {
        this.pendingPostErrorResolve = resolve
        setTimeout(() => {
          this.pendingPostErrorResolve = null
          resolve()
        }, postErrorBuffer)
      })
      this.isWaitingForPostErrorBuffer = false
    }

    try {
      if (!this.replayCapture.isSessionUploaded()) {
        const bufferedEvents = this.replayCapture.getBufferedEvents()

        if (bufferedEvents.length === 0) {
          this.queue.add(event, (evt) =>
            sendEvent(this.config.endpoint, this.config.apiKey, evt, this.config.transport)
          )
          return
        }

        const compressedEvents = btoa(unescape(encodeURIComponent(JSON.stringify(bufferedEvents))))

        await sendErrorWithReplay(
          this.config.endpoint,
          this.config.apiKey,
          sessionId,
          compressedEvents,
          {
            message: event.message,
            file: firstFrame?.filename,
            line: firstFrame?.lineno,
            stack: isError ? (error as Error).stack : undefined,
            level: event.level
          },
          sessionInfo?.url,
          sessionInfo?.userAgent
        )

        this.replayCapture.markSessionUploaded()
        this.replayCapture.clearUploadedEvents()

      } else {
        const newEvents = this.replayCapture.getNewEventsOnly()

        if (newEvents.length > 0) {
          const compressedEvents = btoa(unescape(encodeURIComponent(JSON.stringify(newEvents))))

          await sendErrorWithReplay(
            this.config.endpoint,
            this.config.apiKey,
            sessionId,
            compressedEvents,
            {
              message: event.message,
              file: firstFrame?.filename,
              line: firstFrame?.lineno,
              stack: isError ? (error as Error).stack : undefined,
              level: event.level
            },
            sessionInfo?.url,
            sessionInfo?.userAgent
          )

          this.replayCapture.markSessionUploaded()
          this.replayCapture.clearUploadedEvents()
        } else {
          await sendErrorWithReplay(
            this.config.endpoint,
            this.config.apiKey,
            sessionId,
            null,
            {
              message: event.message,
              file: firstFrame?.filename,
              line: firstFrame?.lineno,
              stack: isError ? (error as Error).stack : undefined,
              level: event.level
            },
            sessionInfo?.url,
            sessionInfo?.userAgent
          )
        }
      }
    } catch (e) {
      if (this.debug) console.warn('ErrorWatch: Failed to send error with replay, falling back', e)
      this.queue.add(event, (evt) =>
        sendEvent(this.config.endpoint, this.config.apiKey, evt, this.config.transport)
      )
    }

    if (this.pendingErrors.length > 0) {
      const errors = [...this.pendingErrors]
      this.pendingErrors = []
      for (const { error: pendingError, event: pendingEvent } of errors) {
        this.captureWithReplay(pendingError, pendingEvent)
      }
    }
  }

  captureMessage(message: string, options?: CaptureOptions): void {
    // Apply sample rate
    const sampleRate = this.config.sampleRate ?? 1.0
    if (sampleRate < 1.0 && Math.random() >= sampleRate) {
      if (this.debug) console.debug('ErrorWatch: Message dropped by sampleRate')
      return
    }

    const event: ErrorEvent = {
      fingerprint: generateFingerprint(new Error(message)),
      message,
      level: options?.level || 'info',
      timestamp: new Date().toISOString(),
      environment: this.config.environment!,
      release: this.config.release,
      user: options?.user || this.currentUser || undefined,
      request: extractRequestContext(),
      tags: options?.tags,
      extra: options?.extra
    }

    this.queue.add(event, (evt) =>
      sendEvent(this.config.endpoint, this.config.apiKey, evt, this.config.transport)
    )
  }

  setUser(user: User | null): void {
    this.currentUser = user
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbManager.add(breadcrumb)
  }

  getReplaySessionId(): string | null {
    return this.replayCapture?.getSessionId() ?? null
  }

  getReplayMode(): ReplayMode {
    return this.replayCapture?.getMode() ?? 'disabled'
  }

  getBreadcrumbManager(): BreadcrumbManager {
    return this.breadcrumbManager
  }

  async flush(): Promise<void> {
    this.queue.flush((evt) =>
      sendEvent(this.config.endpoint, this.config.apiKey, evt, this.config.transport)
    )
  }

  destroy(): void {
    this.breadcrumbManager.destroy()
    if (this.replayCapture) {
      this.replayCapture.stop()
      this.replayCapture = null
    }
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }
    if (this.dedupCleanupInterval) {
      clearInterval(this.dedupCleanupInterval)
      this.dedupCleanupInterval = null
    }
    this.dedupCache.clear()
  }

  private buildEvent(error: Error | unknown, options?: CaptureOptions): ErrorEvent {
    const isError = error instanceof Error
    const breadcrumbs = this.breadcrumbManager.getAll()

    return {
      fingerprint: generateFingerprint(error),
      message: isError ? error.message : String(error),
      level: options?.level || 'error',
      timestamp: new Date().toISOString(),
      environment: this.config.environment!,
      release: this.config.release,
      user: options?.user || this.currentUser || undefined,
      request: extractRequestContext(),
      stacktrace: isError ? parseStacktrace(error) : undefined,
      tags: options?.tags,
      extra: options?.extra,
      breadcrumbs: breadcrumbs.length > 0 ? breadcrumbs : undefined
    }
  }
}
