/**
 * Queue definitions for BullMQ
 * @description Defines all queues used by the monitoring server
 */
import { Queue } from "bullmq";
import { redisConnection } from "./connection";

/**
 * Event queue - processes error events from SDKs
 */
export const eventQueue = new Queue("events", {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

/**
 * Replay queue - processes session replay data
 */
export const replayQueue = new Queue("replays", {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 500,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

/**
 * Alert queue - processes alert notifications (email, Slack, webhooks)
 */
export const alertQueue = new Queue("alerts", {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 7200, // Keep for 2 hours
      count: 500,
    },
    removeOnFail: {
      age: 172800, // Keep failed for 48 hours (important for debugging)
    },
  },
});

/**
 * Job data types
 */
export interface EventJobData {
  projectId: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  stack: string;
  env: string;
  url: string | null;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  statusCode: number | null;
  breadcrumbs: unknown;
  sessionId: string | null;
  release?: string;
  userId?: string | null;
  createdAt: string;
}

export interface ReplayJobData {
  projectId: string;
  sessionId: string;
  events: string | null;
  error: {
    message: string;
    file?: string;
    line?: number;
    stack?: string;
    level: "fatal" | "error" | "warning" | "info" | "debug";
  };
  url: string | null;
  userAgent: string | null;
  timestamp: number;
  release?: string | null;
}

export interface AlertJobData {
  projectId: string;
  fingerprint: string;
  isNewGroup: boolean;
  isRegression?: boolean;
  level: string;
  message: string;
}

/**
 * Aggregation queue - nightly aggregation & cleanup cron jobs
 */
export const aggregationQueue = new Queue("aggregation", {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 604800, // Keep failed for 7 days
    },
  },
});

export type AggregationJobType = "aggregate-hourly" | "aggregate-daily" | "cleanup-expired";

export interface AggregationJobData {
  type: AggregationJobType;
  targetDate?: string; // ISO date string
}
