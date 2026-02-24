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

// ============================================
// System Metrics Types
// ============================================

export type MetricType = 'cpu' | 'memory' | 'disk' | 'network'

export interface CpuMetrics {
  user: number       // % CPU time in user mode
  system: number     // % CPU time in system mode
  idle: number       // % CPU time idle
  iowait: number     // % CPU time waiting for I/O
  steal: number      // % CPU time stolen by hypervisor (VMs)
  nice: number       // % CPU time in nice mode
}

export interface MemoryMetrics {
  total: number      // Total memory in bytes
  used: number       // Used memory in bytes
  free: number       // Free memory in bytes
  available: number  // Available memory in bytes
  cached: number     // Cached memory in bytes
  buffers: number    // Buffer memory in bytes
  swapTotal: number  // Total swap in bytes
  swapUsed: number   // Used swap in bytes
  swapFree: number   // Free swap in bytes
}

export interface DiskMetrics {
  device: string     // Device name (e.g., /dev/sda)
  mountPoint: string // Mount point (e.g., /)
  total: number      // Total disk space in bytes
  used: number       // Used disk space in bytes
  free: number       // Free disk space in bytes
  inodesTotal: number // Total inodes
  inodesUsed: number  // Used inodes
  inodesFree: number  // Free inodes
  readBytes: number   // Bytes read since last sample
  writeBytes: number  // Bytes written since last sample
}

export interface NetworkMetrics {
  interface: string   // Interface name (e.g., eth0)
  rxBytes: number     // Total bytes received
  txBytes: number     // Total bytes transmitted
  rxPackets: number   // Total packets received
  txPackets: number   // Total packets transmitted
  rxErrors: number    // Receive errors
  txErrors: number    // Transmit errors
  rxDropped: number   // Dropped received packets
  txDropped: number   // Dropped transmitted packets
}

export interface SystemMetrics {
  hostname: string    // Host identifier
  timestamp: number   // Unix timestamp (milliseconds)
  os: string          // Operating system (linux, darwin, windows)
  osVersion: string  // OS version
  architecture: string // CPU architecture
  cpu: CpuMetrics
  memory: MemoryMetrics
  disks: DiskMetrics[]
  networks: NetworkMetrics[]
}

export interface MetricSample {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
  unit?: string
}

export interface MetricsPayload {
  hostId: string
  hostname: string
  metrics: SystemMetrics
  tags?: Record<string, string>
}

export interface MetricConfig {
  collectionInterval: number  // ms between collections
  enabled: boolean
  includeDisks?: string[]     // specific disks to monitor
  includeNetworks?: string[]  // specific networks to monitor
  apiKey: string
  endpoint: string
  tags?: Record<string, string>
}

export interface IngestedMetricEvent {
  success: boolean
  hostId: string
  timestamp: number
  count: number
}

export interface SSEMetricsMessage {
  type: 'metrics' | 'heartbeat' | 'error'
  data: SystemMetrics | string
}
