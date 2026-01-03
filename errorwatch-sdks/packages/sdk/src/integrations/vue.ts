/**
 * Vue Integration for ErrorWatch SDK
 *
 * @example
 * // In your main.ts
 * import { createApp } from 'vue'
 * import { init, createPlugin } from '@errorwatch/sdk/vue'
 *
 * init({
 *   dsn: 'http://localhost:3333',
 *   apiKey: 'ew_live_...'
 * })
 *
 * const app = createApp(App)
 * app.use(createPlugin())
 * app.mount('#app')
 */

import {
  init as coreInit,
  captureException as coreCaptureException,
  captureMessage as coreCaptureMessage,
  setUser as coreSetUser,
  addBreadcrumb as coreAddBreadcrumb,
  getReplaySessionId as coreGetReplaySessionId,
  getClient,
  close,
  flush,
} from '../index.js'

import type { SDKConfig, User, CaptureOptions, Breadcrumb } from '../types.js'

// Re-export core functions
export {
  coreInit as init,
  close,
  flush,
  getClient,
}

// Re-export types
export type {
  SDKConfig,
  User,
  CaptureOptions,
  Breadcrumb,
  BreadcrumbCategory,
  BreadcrumbLevel,
  TransportConfig,
  TransportError,
  TransportErrorCode,
  ReplayConfig,
} from '../types.js'

export { ReplayCapture, type ReplayMode, type SessionInfo } from '../replay/index.js'

/**
 * Create a Vue plugin for ErrorWatch
 *
 * @example
 * import { createPlugin } from '@errorwatch/sdk/vue'
 *
 * const app = createApp(App)
 * app.use(createPlugin())
 */
export function createPlugin() {
  return {
    install(app: any) {
      // Vue 3 error handler
      app.config.errorHandler = (err: any, instance: any, info: string) => {
        coreCaptureException(err, {
          extra: {
            componentInfo: info,
            componentName: instance?.$options?.name || instance?.type?.name || 'Anonymous',
          }
        })

        // Re-throw in development for better debugging
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.error(err)
        }
      }

      // Provide client for injection
      const client = getClient()
      if (client) {
        app.provide('errorwatch', client)
        app.config.globalProperties.$errorwatch = client
      }
    }
  }
}

/**
 * Vue composable for error monitoring
 *
 * @example
 * import { useErrorMonitoring } from '@errorwatch/sdk/vue'
 *
 * export default {
 *   setup() {
 *     const { captureException, captureMessage } = useErrorMonitoring()
 *
 *     const handleError = () => {
 *       try {
 *         riskyOperation()
 *       } catch (e) {
 *         captureException(e)
 *       }
 *     }
 *
 *     return { handleError }
 *   }
 * }
 */
export function useErrorMonitoring() {
  return {
    captureException: (error: Error | unknown, options?: CaptureOptions) => {
      coreCaptureException(error, options)
    },
    captureMessage: (message: string, options?: CaptureOptions) => {
      coreCaptureMessage(message, options)
    },
    setUser: (user: User | null) => {
      coreSetUser(user)
    },
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
      coreAddBreadcrumb(breadcrumb)
    },
    getReplaySessionId: () => coreGetReplaySessionId(),
  }
}

/**
 * Get the current replay session ID
 */
export function getReplaySessionId(): string | null {
  return coreGetReplaySessionId()
}
