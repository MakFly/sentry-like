/**
 * Rate Limiting Middleware
 * @description Redis-backed token bucket rate limiter for API endpoints
 * Falls back to in-memory store if Redis is unavailable
 *
 * DEV MODE: Rate limiting is completely DISABLED for development fluency
 * PROD MODE: Full rate limiting with Sentry-like limits
 */
import type { Context, Next } from "hono";
import Redis from "ioredis";
import logger from "../logger";

// Environment check - DISABLE rate limiting in development
const isDev = process.env.NODE_ENV === "development";

// Redis connection
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let redis: Redis | null = null;
let redisAvailable = true;

// Initialize Redis connection
function getRedis(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn("Redis connection failed, falling back to in-memory rate limiting");
            redisAvailable = false;
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      redis.on("error", (err) => {
        logger.error("Redis rate limit error", { error: err.message });
        redisAvailable = false;
      });

      redis.on("connect", () => {
        logger.info("Redis rate limit connected");
        redisAvailable = true;
      });

      redis.connect().catch(() => {
        redisAvailable = false;
      });
    } catch (err) {
      logger.error("Failed to create Redis connection", { error: err });
      redisAvailable = false;
    }
  }
  return redisAvailable ? redis : null;
}

/**
 * In-memory fallback store
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Function to generate rate limit key */
  keyGenerator?: (c: Context) => string;
  /** Custom message when rate limited */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean;
  /** Key prefix for Redis */
  keyPrefix?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,
  keyGenerator: (c) => c.req.header("X-Forwarded-For") || c.req.header("X-Real-IP") || "unknown",
  message: "Too many requests, please try again later",
  skip: () => false,
  keyPrefix: "rl:",
};

/**
 * Clean up expired memory entries periodically
 */
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  let cleaned = 0;

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug("Memory rate limit cleanup", { cleaned, remaining: memoryStore.size });
  }
}

/**
 * Redis-based rate limiting with atomic operations
 */
async function checkRedisRateLimit(
  redisClient: Redis,
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ count: number; resetAt: number }> {
  const windowSec = Math.ceil(windowMs / 1000);
  const now = Date.now();
  const resetAt = now + windowMs;

  // Use Lua script for atomic increment + expire
  const luaScript = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('PTTL', KEYS[1])
    return {current, ttl}
  `;

  try {
    const result = await redisClient.eval(luaScript, 1, key, windowMs) as [number, number];
    const [count, ttl] = result;
    const actualResetAt = ttl > 0 ? now + ttl : resetAt;

    return { count, resetAt: actualResetAt };
  } catch (err) {
    logger.error("Redis rate limit eval failed", { error: err });
    throw err;
  }
}

/**
 * Memory-based rate limiting fallback
 */
function checkMemoryRateLimit(
  key: string,
  windowMs: number
): { count: number; resetAt: number } {
  cleanupMemoryStore();

  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, entry);
  }

  entry.count++;
  return { count: entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limiting middleware factory
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const options: Required<RateLimitConfig> = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    // DEVELOPMENT MODE: Skip ALL rate limiting
    if (isDev) {
      return next();
    }

    // Skip if configured
    if (options.skip(c)) {
      return next();
    }

    const clientKey = options.keyGenerator(c);
    const redisKey = `${options.keyPrefix}${clientKey}`;
    const now = Date.now();

    let count: number;
    let resetAt: number;

    // Try Redis first, fallback to memory
    const redisClient = getRedis();
    if (redisClient && redisAvailable) {
      try {
        const result = await checkRedisRateLimit(
          redisClient,
          redisKey,
          options.windowMs,
          options.maxRequests
        );
        count = result.count;
        resetAt = result.resetAt;
      } catch {
        // Fallback to memory on Redis error
        const result = checkMemoryRateLimit(clientKey, options.windowMs);
        count = result.count;
        resetAt = result.resetAt;
      }
    } else {
      const result = checkMemoryRateLimit(clientKey, options.windowMs);
      count = result.count;
      resetAt = result.resetAt;
    }

    // Calculate remaining
    const remaining = Math.max(0, options.maxRequests - count);
    const resetIn = Math.ceil((resetAt - now) / 1000);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", String(options.maxRequests));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    // Check if rate limited
    if (count > options.maxRequests) {
      logger.warn("Rate limit exceeded", {
        key: clientKey.slice(0, 20),
        count,
        limit: options.maxRequests,
        resetIn,
        backend: redisAvailable ? "redis" : "memory",
      });

      c.header("Retry-After", String(resetIn));

      return c.json(
        {
          error: options.message,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: resetIn,
        },
        429
      );
    }

    return next();
  };
}

/**
 * Pre-configured rate limiters (Sentry-like limits for production)
 * NOTE: In development (isDev), ALL rate limiting is skipped globally
 */
export const rateLimiters = {
  /** SDK event submission - VERY generous (error bursts can be massive) */
  events: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50_000, // 50k events/min per API key
    keyGenerator: (c) => c.req.header("X-API-Key") || "no-key",
    keyPrefix: "rl:events:",
  }),

  /** SDK replay submission - generous for session recording */
  replay: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10_000, // 10k replay events/min per API key
    keyGenerator: (c) => c.req.header("X-API-Key") || "no-key",
    keyPrefix: "rl:replay:",
  }),

  /** Dashboard API endpoints - moderate (polling, refreshes) */
  api: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 1_000, // 1k requests/min per user
    keyGenerator: (c) => c.req.header("X-Forwarded-For") || "unknown",
    keyPrefix: "rl:api:",
  }),

  /** Auth endpoints - strict for brute-force protection */
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 attempts per 15 min
    keyGenerator: (c) => c.req.header("X-Forwarded-For") || "unknown",
    message: "Too many authentication attempts, please try again later",
    keyPrefix: "rl:auth:",
  }),

  /** Webhooks - moderate for external services */
  webhooks: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 500, // 500 webhooks/min
    keyGenerator: (c) => c.req.header("X-Forwarded-For") || "stripe",
    keyPrefix: "rl:webhooks:",
  }),
};

/**
 * Graceful shutdown helper
 */
export async function closeRateLimiter(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
