/**
 * Breadcrumbs Module
 * Captures user actions trail before an error for debugging context
 */

import type { Breadcrumb, BreadcrumbCategory, BreadcrumbLevel, BreadcrumbConfig } from '../types.js'

const DEFAULT_CONFIG: Required<BreadcrumbConfig> = {
  maxBreadcrumbs: 100,
  enableConsoleCapture: true,
  enableClickCapture: true,
  enableNavigationCapture: true,
  enableFetchCapture: true,
  enableXHRCapture: true,
}

export class BreadcrumbManager {
  private breadcrumbs: Breadcrumb[] = []
  private config: Required<BreadcrumbConfig>
  private initialized = false

  private originalConsole: Partial<Console> = {}
  private originalFetch?: typeof fetch
  private originalXHROpen?: typeof XMLHttpRequest.prototype.open
  private originalPushState?: typeof history.pushState
  private originalReplaceState?: typeof history.replaceState

  private clickHandler?: (e: MouseEvent) => void
  private inputHandler?: (e: Event) => void
  private popstateHandler?: () => void

  constructor(config: BreadcrumbConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  add(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      ...breadcrumb
    })

    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.splice(0, this.breadcrumbs.length - this.config.maxBreadcrumbs)
    }
  }

  getAll(): Breadcrumb[] {
    return [...this.breadcrumbs]
  }

  clear(): void {
    this.breadcrumbs = []
  }

  init(): void {
    if (this.initialized) return
    if (typeof window === 'undefined') return

    if (this.config.enableConsoleCapture) this.setupConsoleCapture()
    if (this.config.enableClickCapture) this.setupClickCapture()
    if (this.config.enableNavigationCapture) this.setupNavigationCapture()
    if (this.config.enableFetchCapture) this.setupFetchCapture()
    if (this.config.enableXHRCapture) this.setupXHRCapture()

    this.initialized = true
  }

  destroy(): void {
    if (!this.initialized) return
    if (typeof window === 'undefined') return

    if (this.originalConsole.log) console.log = this.originalConsole.log
    if (this.originalConsole.warn) console.warn = this.originalConsole.warn
    if (this.originalConsole.error) console.error = this.originalConsole.error
    if (this.originalConsole.info) console.info = this.originalConsole.info
    if (this.originalConsole.debug) console.debug = this.originalConsole.debug
    this.originalConsole = {}

    if (this.originalFetch) {
      window.fetch = this.originalFetch
      this.originalFetch = undefined
    }

    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen
      this.originalXHROpen = undefined
    }

    if (this.originalPushState) {
      history.pushState = this.originalPushState
      this.originalPushState = undefined
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState
      this.originalReplaceState = undefined
    }

    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true)
      this.clickHandler = undefined
    }
    if (this.inputHandler) {
      document.removeEventListener('input', this.inputHandler, true)
      this.inputHandler = undefined
    }
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler)
      this.popstateHandler = undefined
    }

    this.initialized = false
  }

  private setupConsoleCapture(): void {
    const methods: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = [
      'log', 'warn', 'error', 'info', 'debug'
    ]

    const levelMap: Record<string, BreadcrumbLevel> = {
      log: 'info',
      info: 'info',
      debug: 'debug',
      warn: 'warning',
      error: 'error',
    }

    methods.forEach(method => {
      const original = console[method]
      if (typeof original !== 'function') return

      this.originalConsole[method] = original

      console[method] = (...args: any[]) => {
        try {
          this.add({
            category: 'console',
            type: method,
            level: levelMap[method] || 'info',
            message: args.map(arg => {
              try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              } catch {
                return '[Unserializable]'
              }
            }).join(' ')
          })
        } catch {}
        (original as Function).apply(console, args)
      }
    })
  }

  private setupClickCapture(): void {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const selector = this.getElementSelector(target)
      const text = target.textContent?.slice(0, 50)?.trim()

      this.add({
        category: 'ui',
        type: 'click',
        message: text ? `Click on "${text}"` : `Click on ${selector}`,
        data: {
          selector,
          tagName: target.tagName.toLowerCase(),
          id: target.id || undefined,
          className: target.className || undefined,
          x: e.clientX,
          y: e.clientY,
        }
      })
    }
    document.addEventListener('click', this.clickHandler, { capture: true, passive: true })

    this.inputHandler = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target) return

      const selector = this.getElementSelector(target)
      const inputType = target.type || 'text'

      this.add({
        category: 'ui',
        type: 'input',
        message: `Input on ${selector}`,
        data: {
          selector,
          tagName: target.tagName.toLowerCase(),
          inputType,
          name: target.name || undefined,
        }
      })
    }
    document.addEventListener('input', this.inputHandler, { capture: true, passive: true })
  }

  private setupNavigationCapture(): void {
    this.originalPushState = history.pushState
    this.originalReplaceState = history.replaceState

    this.popstateHandler = () => {
      this.add({
        category: 'navigation',
        type: 'popstate',
        message: `Navigate to ${window.location.pathname}`,
        data: {
          url: window.location.href,
          pathname: window.location.pathname,
        }
      })
    }
    window.addEventListener('popstate', this.popstateHandler)

    const self = this
    history.pushState = function(...args) {
      self.originalPushState!.apply(history, args)
      self.add({
        category: 'navigation',
        type: 'pushstate',
        message: `Navigate to ${args[2] || window.location.pathname}`,
        data: { url: String(args[2]) || window.location.href }
      })
    }

    history.replaceState = function(...args) {
      self.originalReplaceState!.apply(history, args)
      self.add({
        category: 'navigation',
        type: 'replacestate',
        message: `Replace state to ${args[2] || window.location.pathname}`,
        data: { url: String(args[2]) || window.location.href }
      })
    }
  }

  private setupFetchCapture(): void {
    this.originalFetch = window.fetch
    const self = this

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const method = init?.method || 'GET'
      const startTime = Date.now()

      self.add({
        category: 'http',
        type: 'fetch',
        level: 'info',
        message: `${method} ${url}`,
        data: { method, url }
      })

      try {
        const response = await self.originalFetch!.call(window, input, init)
        const duration = Date.now() - startTime

        self.add({
          category: 'http',
          type: 'fetch.response',
          level: response.ok ? 'info' : 'warning',
          message: `${method} ${url} - ${response.status}`,
          data: { method, url, status: response.status, statusText: response.statusText, duration }
        })

        return response
      } catch (error) {
        const duration = Date.now() - startTime

        self.add({
          category: 'http',
          type: 'fetch.error',
          level: 'error',
          message: `${method} ${url} - Failed`,
          data: { method, url, error: error instanceof Error ? error.message : String(error), duration }
        })

        throw error
      }
    }
  }

  private setupXHRCapture(): void {
    this.originalXHROpen = XMLHttpRequest.prototype.open
    const self = this

    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      const xhr = this
      const urlString = url.toString()
      let startTime: number = Date.now()

      const loadstartHandler = () => {
        startTime = Date.now()
        self.add({
          category: 'http',
          type: 'xhr',
          level: 'info',
          message: `${method} ${urlString}`,
          data: { method, url: urlString }
        })
      }

      const loadendHandler = () => {
        const duration = Date.now() - startTime
        const isError = xhr.status === 0 || xhr.status >= 400

        self.add({
          category: 'http',
          type: 'xhr.response',
          level: isError ? 'error' : 'info',
          message: `${method} ${urlString} - ${xhr.status || 'Network Error'}`,
          data: { method, url: urlString, status: xhr.status, statusText: xhr.statusText || (xhr.status === 0 ? 'Network Error' : ''), duration }
        })
      }

      xhr.addEventListener('loadstart', loadstartHandler, { once: true })
      xhr.addEventListener('loadend', loadendHandler, { once: true })

      return self.originalXHROpen!.call(this, method, url, async, username, password)
    }
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`

    const tag = element.tagName.toLowerCase()

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(Boolean).slice(0, 2).join('.')
      if (classes) return `${tag}.${classes}`
    }

    const dataTestId = element.getAttribute('data-testid')
    if (dataTestId) return `${tag}[data-testid="${dataTestId}"]`

    const name = element.getAttribute('name')
    if (name) return `${tag}[name="${name}"]`

    return tag
  }
}

// Singleton
let globalBreadcrumbManager: BreadcrumbManager | null = null

export function getBreadcrumbManager(): BreadcrumbManager {
  if (!globalBreadcrumbManager) {
    globalBreadcrumbManager = new BreadcrumbManager()
  }
  return globalBreadcrumbManager
}

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  getBreadcrumbManager().add(breadcrumb)
}
