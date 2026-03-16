type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: unknown
}

interface LogConfig {
  level: LogLevel
  enableColors?: boolean
  enableTimestamp?: boolean
}

const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m'
}

const levelColors: Record<LogLevel, string> = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.green,
  debug: colors.gray
}

const levelIcons: Record<LogLevel, string> = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍'
}

class Logger {
  private config: LogConfig

  constructor(config: Partial<LogConfig> = {}) {
    const env = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development'
    const isProduction = env === 'production'

    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug'),
      enableColors: config.enableColors ?? !isProduction,
      enableTimestamp: config.enableTimestamp ?? true
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] <= levelPriority[this.config.level]
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const parts: string[] = []

    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString()
      parts.push(`${colors.gray}[${timestamp}]${colors.reset}`)
    }

    const color = this.config.enableColors ? levelColors[level] : ''
    const reset = this.config.enableColors ? colors.reset : ''
    const icon = levelIcons[level]

    parts.push(`${color}${icon} [${level.toUpperCase()}]${reset}`)
    parts.push(message)

    if (context && Object.keys(context).length > 0) {
      const contextStr = this.formatContext(context)
      parts.push(contextStr)
    }

    return parts.join(' ')
  }

  private formatContext(context: LogContext): string {
    try {
      const str = JSON.stringify(context, null, 2)
      return this.config.enableColors ? `${colors.gray}${str}${colors.reset}` : str
    } catch {
      return String(context)
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }
}

class ChildLogger {
  private parent: Logger
  private context: LogContext

  constructor(parent: Logger, context: LogContext) {
    this.parent = parent
    this.context = context
  }

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.context, ...context }
  }

  error(message: string, context?: LogContext): void {
    this.parent.error(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context))
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context))
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this.parent, this.mergeContext(context))
  }
}

const logger = new Logger()

export default logger
export { Logger, ChildLogger, type LogContext, type LogLevel, type LogConfig }
