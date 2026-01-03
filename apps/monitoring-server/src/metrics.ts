/**
 * Prometheus Metrics
 * @description Application metrics for monitoring and alerting
 */
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

// Create a custom registry
export const register = new Registry();

// Add default metrics (process, nodejs, gc)
collectDefaultMetrics({ register });

// === HTTP Metrics ===

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [register],
});

// === Event Processing Metrics ===

export const eventsReceived = new Counter({
  name: "events_received_total",
  help: "Total number of error events received",
  labelNames: ["project_id", "level"],
  registers: [register],
});

export const eventsProcessed = new Counter({
  name: "events_processed_total",
  help: "Total number of error events processed",
  labelNames: ["status"], // success, failure
  registers: [register],
});

export const eventProcessingDuration = new Histogram({
  name: "event_processing_duration_ms",
  help: "Event processing duration in milliseconds",
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

// === Queue Metrics ===

export const queueSize = new Gauge({
  name: "queue_size",
  help: "Current size of job queue",
  labelNames: ["queue"],
  registers: [register],
});

export const queueJobsCompleted = new Counter({
  name: "queue_jobs_completed_total",
  help: "Total number of completed jobs",
  labelNames: ["queue"],
  registers: [register],
});

export const queueJobsFailed = new Counter({
  name: "queue_jobs_failed_total",
  help: "Total number of failed jobs",
  labelNames: ["queue"],
  registers: [register],
});

// === Database Metrics ===

export const dbQueryDuration = new Histogram({
  name: "db_query_duration_ms",
  help: "Database query duration in milliseconds",
  labelNames: ["operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

export const dbConnections = new Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
  registers: [register],
});

// === Alert Metrics ===

export const alertsSent = new Counter({
  name: "alerts_sent_total",
  help: "Total number of alerts sent",
  labelNames: ["channel", "status"], // email/slack/webhook, success/failure
  registers: [register],
});

// === Rate Limiting Metrics ===

export const rateLimitHits = new Counter({
  name: "rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["key_prefix"],
  registers: [register],
});

// === Helper: Increment HTTP metrics ===
export function recordHttpRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number
): void {
  // Normalize path to avoid high cardinality
  const normalizedPath = normalizePath(path);

  httpRequestsTotal.inc({ method, path: normalizedPath, status: String(status) });
  httpRequestDuration.observe({ method, path: normalizedPath, status: String(status) }, durationMs);
}

/**
 * Normalize path to prevent high cardinality
 * /api/v1/groups/abc123 -> /api/v1/groups/:id
 */
function normalizePath(path: string): string {
  return path
    // UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id")
    // Generic IDs (alphanumeric 16+ chars)
    .replace(/\/[a-zA-Z0-9]{16,}\/?/g, "/:id/")
    // Numeric IDs
    .replace(/\/\d+\/?/g, "/:id/")
    // Fingerprints (hex 40 chars)
    .replace(/[a-f0-9]{40}/gi, ":fingerprint")
    // Clean up trailing slashes
    .replace(/\/+$/, "");
}
