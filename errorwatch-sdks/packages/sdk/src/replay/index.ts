/**
 * Session Replay Module using rrweb
 * Records and replays user sessions for debugging
 *
 * Two modes like Sentry:
 * - Session Mode: Records and sends entire sessions (replaysSessionSampleRate)
 * - Buffer Mode: Records in memory, only sends when error occurs (replaysOnErrorSampleRate)
 */

import * as rrweb from 'rrweb'
import type { eventWithTime } from 'rrweb/typings/types'
import type { ReplayConfig } from '../types.js'

export type ReplayMode = 'session' | 'buffer' | 'disabled'

export interface SessionInfo {
  id: string
  startedAt: number
  url: string
  userAgent: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
}

interface InternalConfig {
  enabled: boolean
  debug: boolean
  replaysSessionSampleRate: number
  replaysOnErrorSampleRate: number
  maskAllInputs: boolean
  maskTextSelector: string
  blockSelector: string
  maxReplayDuration: number
  flushInterval: number
  postErrorBuffer: number
}

const DEFAULT_CONFIG: InternalConfig = {
  enabled: true,
  debug: false,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  maskAllInputs: true,
  maskTextSelector: '.sensitive, [data-sensitive]',
  blockSelector: '.private, [data-private]',
  maxReplayDuration: 60000,
  flushInterval: 10000,
  postErrorBuffer: 5000,
}

const MAX_BUFFER_EVENTS = 10000

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Safari/')) return 'Safari'
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera'
  return 'unknown'
}

function getOS(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'unknown'
}

export class ReplayCapture {
  private recording = false
  private events: eventWithTime[] = []
  private sessionId: string
  private config: InternalConfig
  private startTime: number = 0
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private sessionInfo: SessionInfo | null = null
  private onFlushCallback?: (events: string, sessionId: string) => Promise<void>
  private mode: ReplayMode = 'disabled'
  private sessionUploaded = false
  private lastUploadTimestamp: number = 0
  private stopRecording: (() => void) | null = null

  constructor(config: ReplayConfig = {}) {
    const sessionRate = config.replaysSessionSampleRate ?? config.sampleRate ?? DEFAULT_CONFIG.replaysSessionSampleRate
    const errorRate = config.replaysOnErrorSampleRate ?? DEFAULT_CONFIG.replaysOnErrorSampleRate

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      enabled: config.enabled ?? true,
      replaysSessionSampleRate: sessionRate,
      replaysOnErrorSampleRate: errorRate,
    }
    this.sessionId = generateId()
  }

  onFlush(callback: (events: string, sessionId: string) => Promise<void>): void {
    this.onFlushCallback = callback
  }

  getMode(): ReplayMode {
    return this.mode
  }

  start(): boolean {
    if (!this.config.enabled) {
      this.mode = 'disabled'
      return false
    }
    if (typeof window === 'undefined') {
      this.mode = 'disabled'
      return false
    }
    if (this.recording) return true

    // Session mode sampling
    if (this.config.replaysSessionSampleRate > 0 && Math.random() <= this.config.replaysSessionSampleRate) {
      this.mode = 'session'
      this.startRecording(true)
      return true
    }

    // Buffer mode sampling (error-triggered)
    if (this.config.replaysOnErrorSampleRate > 0 && Math.random() <= this.config.replaysOnErrorSampleRate) {
      this.mode = 'buffer'
      this.startRecording(false)
      return true
    }

    this.mode = 'disabled'
    return false
  }

  private startRecording(withFlushTimer: boolean): void {
    this.startTime = Date.now()
    this.recording = true

    this.sessionInfo = {
      id: this.sessionId,
      startedAt: this.startTime,
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
    }

    // Start rrweb recording (v1 API)
    const stopFn = rrweb.record({
      emit: (event: eventWithTime) => {
        this.handleEvent(event)
      },
      maskAllInputs: this.config.maskAllInputs,
      blockClass: 'private',
      ignoreClass: 'ignore',
      // Sampling for performance
      sampling: {
        mousemove: true,
        mouseInteraction: true,
        scroll: 150,
        input: 'last',
      },
      // Collect fonts for accurate replay
      collectFonts: true,
    })
    this.stopRecording = stopFn || null

    if (this.config.debug) console.log('%c rrweb recording started ', 'background: purple; color: white', this.mode)

    // Setup flush timer ONLY for session mode
    if (withFlushTimer && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.config.flushInterval)
    }
  }

  private handleEvent(event: eventWithTime): void {
    if (!this.recording) return

    // Check max duration - rolling buffer in buffer mode
    if (Date.now() - this.startTime > this.config.maxReplayDuration) {
      if (this.mode === 'buffer') {
        const cutoff = Date.now() - this.config.maxReplayDuration
        this.events = this.events.filter(e => e.timestamp >= cutoff)
      } else {
        this.stop()
        return
      }
    }

    // Prevent memory exhaustion
    if (this.events.length >= MAX_BUFFER_EVENTS) {
      if (this.mode === 'session') {
        this.flush()
      } else {
        this.events = this.events.slice(-MAX_BUFFER_EVENTS + 1000)
      }
    }

    this.events.push(event)
  }

  stop(): void {
    if (!this.recording) return

    this.recording = false

    // Stop rrweb recording
    if (this.stopRecording) {
      this.stopRecording()
      this.stopRecording = null
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    if (this.mode === 'session') {
      this.flush()
    }

    if (this.config.debug) console.log('%c rrweb recording stopped ', 'background: gray; color: white')
  }

  getSessionId(): string {
    return this.sessionId
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo
  }

  isRecording(): boolean {
    return this.recording
  }

  getPostErrorBuffer(): number {
    return this.config.postErrorBuffer
  }

  isSessionUploaded(): boolean {
    return this.sessionUploaded
  }

  markSessionUploaded(): void {
    this.sessionUploaded = true
    this.lastUploadTimestamp = Date.now()
  }

  getRecentEvents(seconds: number = 60): eventWithTime[] {
    const cutoff = Date.now() - (seconds * 1000)
    return this.events.filter(e => e.timestamp >= cutoff)
  }

  getBufferedEvents(): eventWithTime[] {
    return [...this.events]
  }

  clearBuffer(): void {
    this.events = []
  }

  getNewEventsOnly(): eventWithTime[] {
    if (this.lastUploadTimestamp === 0) {
      return [...this.events]
    }
    return this.events.filter(e => e.timestamp > this.lastUploadTimestamp)
  }

  clearUploadedEvents(): void {
    if (this.lastUploadTimestamp > 0) {
      this.events = this.events.filter(e => e.timestamp > this.lastUploadTimestamp)
    }
  }

  async flush(): Promise<void> {
    if (this.mode !== 'session') return
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    const compressed = btoa(unescape(encodeURIComponent(JSON.stringify(eventsToSend))))

    if (this.onFlushCallback) {
      try {
        await this.onFlushCallback(compressed, this.sessionId)
      } catch (e) {
        this.events = [...eventsToSend, ...this.events]
        if (this.config.debug) console.warn('ErrorWatch: Failed to flush replay events', e)
      }
    }
  }
}

let globalReplayCapture: ReplayCapture | null = null

export function getReplayCapture(): ReplayCapture {
  if (!globalReplayCapture) {
    globalReplayCapture = new ReplayCapture()
  }
  return globalReplayCapture
}
