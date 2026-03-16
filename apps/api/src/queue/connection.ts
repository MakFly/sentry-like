/**
 * Redis connection for BullMQ
 * @description Manages Redis connection for job queues
 */
import { Redis } from "ioredis";
import logger from "../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Redis client instance
 * maxRetriesPerRequest: null is required for BullMQ
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error("Redis connection failed after 10 retries");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  logger.info("Redis connected", { url: REDIS_URL.replace(/\/\/.*@/, "//***@") });
});

redis.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});

/**
 * Connection options for BullMQ queues and workers
 */
export const redisConnection = {
  connection: redis,
};

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Health check alias for readability
 */
export const isRedisHealthy = isRedisAvailable;

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  await redis.quit();
}
