import { Redis } from "ioredis";
import logger from "../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Dedicated Redis client for publishing (separate from BullMQ)
const pubClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

let connected = false;

async function ensureConnected(): Promise<boolean> {
  if (connected) return true;
  try {
    await pubClient.connect();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

pubClient.on("error", (err) => {
  logger.warn("SSE pub client error", { error: err.message });
  connected = false;
});

export interface SSEEvent {
  type: "issue:new" | "issue:updated" | "issue:regressed" | "alert:triggered" | "transaction:new" | "replay:new" | "log:new";
  projectId: string;
  payload: {
    fingerprint?: string;
    message?: string;
    level?: string;
    sessionId?: string;
    transactionId?: string;
    log?: {
      id: string;
      timestamp: string;
      level: string;
      channel: string;
      message: string;
      source: string;
      env?: string | null;
      release?: string | null;
    };
    sampled?: boolean;
  };
  timestamp: number;
}

export async function publishEvent(orgId: string, event: SSEEvent): Promise<void> {
  try {
    if (!(await ensureConnected())) return;
    await pubClient.publish(`sse:org:${orgId}`, JSON.stringify(event));
  } catch (err) {
    // Fire-and-forget: don't block the worker if Redis pub fails
    logger.warn("SSE publish failed", { orgId, type: event.type, error: err });
  }
}

export async function closePubClient(): Promise<void> {
  if (connected) {
    await pubClient.quit();
    connected = false;
  }
}
