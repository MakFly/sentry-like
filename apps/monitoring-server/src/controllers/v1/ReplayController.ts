/**
 * Replay Controller
 * @description Handles rrweb session replay recording and playback
 */
import type { Context } from "hono";
import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { db } from "../../db/connection";
import { replaySessions, sessionEvents, errorGroups, errorEvents } from "../../db/schema";
import { verifyProjectAccess } from "../../services/project-access";
import { triggerAlertsForNewError } from "../../services/alerts";
import { eq, desc, sql, and } from "drizzle-orm";
import { createHash } from "crypto";
import logger from "../../logger";
import { gunzipSync } from "zlib";

// === Validation Schemas ===

const startSessionSchema = z.object({
  sessionId: z.string().uuid(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  browser: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  userId: z.string().max(100).optional(),
  viewport: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
});

const submitEventsSchema = z.object({
  sessionId: z.string().uuid(),
  events: z.string().max(50 * 1024 * 1024), // Max 50MB compressed base64 events
  timestamp: z.number(),
  count: z.number().optional(), // Event count for logging
});

const endSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * Decompress gzip base64 events (rrweb format)
 * Falls back to plain base64 JSON for backwards compatibility
 */
function decompressEvents(compressedBase64: string): unknown[] {
  try {
    const buffer = Buffer.from(compressedBase64, "base64");

    // Try gzip decompression first (rrweb format)
    try {
      const decompressed = gunzipSync(buffer);
      return JSON.parse(decompressed.toString("utf-8"));
    } catch {
      // Fallback: plain base64 JSON (old format)
      return JSON.parse(buffer.toString("utf-8"));
    }
  } catch (e) {
    logger.error("Failed to decompress events", { error: e });
    throw new Error("Invalid event data");
  }
}

/**
 * Start a new session recording
 */
export const startSession = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = startSessionSchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    const now = new Date();

    // Create session record
    await db.insert(replaySessions).values({
      id: input.sessionId,
      projectId,
      userId: input.userId || null,
      startedAt: now,
      url: input.url || null,
      userAgent: input.userAgent || null,
      deviceType: input.deviceType || null,
      browser: input.browser || null,
      os: input.os || null,
      createdAt: now,
    });

    logger.info("Started rrweb replay session", {
      sessionId: input.sessionId,
      projectId,
      viewport: input.viewport,
    });

    return c.json({ success: true, sessionId: input.sessionId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid session start input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
    }

    logger.error("Failed to start session", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    // Return detailed error in development
    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};

/**
 * Submit session events
 */
export const submitEvents = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = submitEventsSchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    // Verify session exists and belongs to project
    const session = (await db
      .select()
      .from(replaySessions)
      .where(eq(replaySessions.id, input.sessionId)))[0];

    if (!session) {
      return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
    }

    if (session.projectId !== projectId) {
      return c.json({ error: "Session does not belong to project", code: "FORBIDDEN" }, 403);
    }

    // Determine event type from first event (for rrweb seek optimization)
    // Type 2 = FullSnapshot (important for seeking)
    let eventType = 3; // Default to IncrementalSnapshot
    let eventCount = input.count || 0;

    try {
      const events = decompressEvents(input.events);
      if (Array.isArray(events) && events.length > 0) {
        eventCount = events.length;
        const firstEvent = events[0] as { type?: number };
        if (firstEvent.type === 2) {
          eventType = 2; // FullSnapshot
        }
      }
    } catch {
      // Continue with defaults if decompression fails for peek
    }

    // Store events (keep compressed)
    await db.insert(sessionEvents).values({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      type: eventType,
      data: input.events,
      timestamp: new Date(input.timestamp),
    });

    logger.debug("Stored rrweb replay events", {
      sessionId: input.sessionId,
      eventCount,
      eventType,
      compressedSize: input.events.length,
    });

    return c.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid events input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
    }

    logger.error("Failed to submit events", {
      error: e instanceof Error ? e.message : "Unknown error",
    });

    return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
  }
};

/**
 * End a session recording
 */
export const endSession = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = endSessionSchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    // Update session with end time
    const session = (await db
      .select()
      .from(replaySessions)
      .where(eq(replaySessions.id, input.sessionId)))[0];

    if (!session) {
      return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
    }

    // Authorization check: verify session belongs to the project
    if (session.projectId !== projectId) {
      logger.warn("Attempted to end session from different project", {
        sessionId: input.sessionId,
        sessionProjectId: session.projectId,
        requestProjectId: projectId,
      });
      return c.json({ error: "Session does not belong to project", code: "FORBIDDEN" }, 403);
    }

    const now = new Date();
    const duration = now.getTime() - session.startedAt.getTime();

    await db
      .update(replaySessions)
      .set({
        endedAt: now,
        duration,
      })
      .where(eq(replaySessions.id, input.sessionId));

    logger.info("Ended replay session", {
      sessionId: input.sessionId,
      duration,
    });

    return c.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid end session input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
    }

    logger.error("Failed to end session", {
      error: e instanceof Error ? e.message : "Unknown error",
    });

    return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
  }
};

/**
 * Get session details (dashboard)
 *
 * Handles race condition: backend errors may reference a sessionId before
 * the frontend has sent the replay data. In this case, we return a "pending"
 * status instead of 404.
 */
export const getSession = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const sessionId = c.req.param("id");

    const session = (await db
      .select()
      .from(replaySessions)
      .where(eq(replaySessions.id, sessionId)))[0];

    if (!session) {
      // Check if any error_event references this sessionId
      // This handles the race condition where backend errors arrive before replay data
      const referencingError = (await db
        .select({ id: errorEvents.id, projectId: errorEvents.projectId })
        .from(errorEvents)
        .where(eq(errorEvents.sessionId, sessionId))
        .limit(1))[0];

      if (referencingError) {
        // Session is referenced but replay data not yet received
        // Verify access via the error's project
        const hasAccess = await verifyProjectAccess(referencingError.projectId, userId);
        if (!hasAccess) {
          return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
        }

        return c.json({
          id: sessionId,
          projectId: referencingError.projectId,
          status: "pending",
          message: "Replay data not yet received. The session recording may still be uploading or was not captured.",
        }, 202); // 202 Accepted - resource exists but not complete
      }

      return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
    }

    const hasAccess = await verifyProjectAccess(session.projectId, userId);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    return c.json({ ...session, status: "complete" });
  } catch (e) {
    logger.error("Failed to get session", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};

/**
 * Get session events (dashboard)
 * Supports optional errorEventId query param to get events for a specific error
 * Supports optional errorTime query param to filter events by time window (Sentry-like)
 */
export const getSessionEvents = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const sessionId = c.req.param("id");
    const errorEventId = c.req.query("errorEventId"); // Optional: filter by specific error
    const errorTime = c.req.query("errorTime"); // Optional: error timestamp for time window filtering

    const session = (await db
      .select()
      .from(replaySessions)
      .where(eq(replaySessions.id, sessionId)))[0];

    if (!session) {
      return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
    }

    const hasAccess = await verifyProjectAccess(session.projectId, userId);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // Get events - filter by errorEventId if provided (Sentry-like: each error has its own replay)
    let eventRows;
    if (errorEventId) {
      // Try to get events for specific error first
      eventRows = await db
        .select()
        .from(sessionEvents)
        .where(and(
          eq(sessionEvents.sessionId, sessionId),
          eq(sessionEvents.errorEventId, errorEventId)
        ))
        .orderBy(sessionEvents.timestamp)
        ;

      // Fallback: if no events found with errorEventId, get all events for session
      // This handles cases where events were stored without errorEventId link
      if (eventRows.length === 0) {
        logger.debug("No events found for errorEventId, falling back to session events", { sessionId, errorEventId });
        eventRows = await db
          .select()
          .from(sessionEvents)
          .where(eq(sessionEvents.sessionId, sessionId))
          .orderBy(sessionEvents.timestamp)
          ;
      }
    } else {
      // Get all events for session (backwards compatibility)
      eventRows = await db
        .select()
        .from(sessionEvents)
        .where(eq(sessionEvents.sessionId, sessionId))
        .orderBy(sessionEvents.timestamp)
        ;
    }

    // Decompress and combine all events into rrweb-compatible array
    const allEvents: Array<{ type: number; data: unknown; timestamp: number }> = [];

    for (const row of eventRows) {
      try {
        const events = decompressEvents(row.data);
        if (Array.isArray(events)) {
          allEvents.push(...(events as Array<{ type: number; data: unknown; timestamp: number }>));
        }
      } catch (e) {
        logger.warn("Failed to decode event batch", {
          sessionId,
          eventId: row.id,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    // Sort by timestamp (rrweb-player requires chronological order)
    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Filter by time window if errorTime is provided (Sentry-like: 60s before, 5s after)
    let filteredEvents = allEvents;
    if (errorTime && allEvents.length > 0) {
      try {
        const errorTimestamp = new Date(decodeURIComponent(errorTime)).getTime();
        const windowStart = errorTimestamp - 60000; // 60 seconds before
        const windowEnd = errorTimestamp + 5000;    // 5 seconds after

        // Get first event timestamp to detect format (seconds vs milliseconds)
        const firstEventTs = allEvents[0].timestamp;
        const isSecondsFormat = firstEventTs < 10000000000; // Less than year 2286 in seconds

        let adjustedStart = windowStart;
        let adjustedEnd = windowEnd;

        if (isSecondsFormat) {
          // Events are in seconds, convert window to seconds
          adjustedStart = Math.floor(windowStart / 1000);
          adjustedEnd = Math.ceil(windowEnd / 1000);
        }

        filteredEvents = allEvents.filter(event =>
          event.timestamp >= adjustedStart && event.timestamp <= adjustedEnd
        );

        logger.debug("Filtered events by time window", {
          sessionId,
          errorTime,
          errorTimestamp,
          windowStart: adjustedStart,
          windowEnd: adjustedEnd,
          isSecondsFormat,
          firstEventTs,
          totalEvents: allEvents.length,
          filteredEvents: filteredEvents.length,
        });

        // Fallback: if no events in window, return all events
        if (filteredEvents.length === 0 && allEvents.length > 0) {
          logger.info("No events in time window, returning all events as fallback", {
            sessionId,
            totalEvents: allEvents.length,
          });
          filteredEvents = allEvents;
        }
      } catch (e) {
        logger.warn("Failed to parse errorTime, returning all events", { errorTime, error: e });
        filteredEvents = allEvents;
      }
    }

    // Return in rrweb-player compatible format with metadata
    return c.json({
      events: filteredEvents,
      metadata: {
        sessionId: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        url: session.url,
        userAgent: session.userAgent,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
      },
    });
  } catch (e) {
    logger.error("Failed to get session events", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};

/**
 * List sessions for a project (dashboard)
 */
export const listSessions = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.query("projectId");
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);

    if (!projectId) {
      return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
    }

    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalResult = (await db
      .select({ count: sql<number>`count(*)` })
      .from(replaySessions)
      .where(eq(replaySessions.projectId, projectId)))[0];

    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const sessions = await db
      .select()
      .from(replaySessions)
      .where(eq(replaySessions.projectId, projectId))
      .orderBy(desc(replaySessions.startedAt))
      .limit(limit)
      .offset(offset)
      ;

    return c.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (e) {
    logger.error("Failed to list sessions", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};

// === Error-Triggered Replay (Sentry-like architecture) ===

/**
 * Schema for error-triggered replay submission
 *
 * Sentry-like architecture:
 * - First error: events contains compressed rrweb buffer
 * - Subsequent errors: events is null (session already uploaded)
 */
const errorReplaySchema = z.object({
  sessionId: z.string().uuid(),
  events: z.string().max(50 * 1024 * 1024).nullable(), // NULL for subsequent errors
  error: z.object({
    message: z.string().min(1).max(10000),
    file: z.string().max(1000).nullish(), // Accept null, undefined, or string
    line: z.number().int().positive().nullish(), // Accept null, undefined, or positive int
    stack: z.string().max(100000).nullish(), // Accept null, undefined, or string
    level: z.enum(["fatal", "error", "warning", "info", "debug"]).default("error"),
  }),
  url: z.string().max(2000).nullish(),
  userAgent: z.string().max(500).nullish(),
  timestamp: z.number(),
  release: z.string().max(100).nullish(), // Release version (e.g., "1.2.3", "abc123")
});

/**
 * Helper to detect device info from user agent
 */
function parseUserAgent(ua?: string): { deviceType: string; browser: string; os: string } {
  if (!ua) return { deviceType: "desktop", browser: "Unknown", os: "Unknown" };

  const deviceType = /tablet|ipad/i.test(ua) ? "tablet" :
                     /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";
  const browser = ua.includes("Firefox/") ? "Firefox" :
                  ua.includes("Edg/") ? "Edge" :
                  ua.includes("Chrome/") ? "Chrome" :
                  ua.includes("Safari/") ? "Safari" : "Unknown";
  const os = ua.includes("Windows") ? "Windows" :
             ua.includes("Mac OS") ? "macOS" :
             ua.includes("Linux") ? "Linux" :
             ua.includes("Android") ? "Android" :
             (ua.includes("iOS") || ua.includes("iPhone")) ? "iOS" : "Unknown";

  return { deviceType, browser, os };
}

/**
 * Handle error-triggered replay submission
 *
 * Sentry-like architecture:
 * - First error: Creates replay session + stores events + creates error
 * - Subsequent errors: Only creates error linked to existing session (no duplication)
 *
 * Events are queued for async processing via BullMQ
 */
// === Session-Centric Listing with Errors (Dashboard) ===

/**
 * Validation schema for listSessionsWithErrors filters
 */
const sessionsWithErrorsFiltersSchema = z.object({
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  durationMin: z.coerce.number().optional(),
  durationMax: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  errorCountMin: z.coerce.number().optional(),
  severity: z.enum(["fatal", "error", "warning", "info", "debug"]).optional(),
});

/**
 * List sessions with aggregated error data (session-centric view)
 *
 * Returns replay sessions with:
 * - Error count per session
 * - Max severity level
 * - Linked error fingerprints
 * - First error message preview
 * - Device distribution stats
 */
export const listSessionsWithErrors = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.query("projectId");
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 100);

    if (!projectId) {
      return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
    }

    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // Parse filters from query params
    const rawFilters = {
      deviceType: c.req.query("deviceType"),
      browser: c.req.query("browser"),
      os: c.req.query("os"),
      durationMin: c.req.query("durationMin"),
      durationMax: c.req.query("durationMax"),
      dateFrom: c.req.query("dateFrom"),
      dateTo: c.req.query("dateTo"),
      errorCountMin: c.req.query("errorCountMin"),
      severity: c.req.query("severity"),
    };

    const filters = sessionsWithErrorsFiltersSchema.parse(rawFilters);
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [eq(replaySessions.projectId, projectId)];

    if (filters.deviceType) {
      conditions.push(eq(replaySessions.deviceType, filters.deviceType));
    }
    if (filters.browser) {
      conditions.push(sql`${replaySessions.browser} LIKE ${`%${filters.browser}%`}`);
    }
    if (filters.os) {
      conditions.push(sql`${replaySessions.os} LIKE ${`%${filters.os}%`}`);
    }
    if (filters.durationMin !== undefined) {
      conditions.push(sql`${replaySessions.duration} >= ${filters.durationMin}`);
    }
    if (filters.durationMax !== undefined) {
      conditions.push(sql`${replaySessions.duration} <= ${filters.durationMax}`);
    }
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      conditions.push(sql`${replaySessions.startedAt} >= ${dateFrom.getTime() / 1000}`);
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      conditions.push(sql`${replaySessions.startedAt} <= ${dateTo.getTime() / 1000}`);
    }

    // Severity rank mapping for MAX calculation
    const severityRank = sql<number>`
      MAX(CASE
        WHEN ${errorEvents.level} = 'fatal' THEN 5
        WHEN ${errorEvents.level} = 'error' THEN 4
        WHEN ${errorEvents.level} = 'warning' THEN 3
        WHEN ${errorEvents.level} = 'info' THEN 2
        WHEN ${errorEvents.level} = 'debug' THEN 1
        ELSE 0
      END)
    `;

    // Main query with LEFT JOIN and aggregation
    const baseQuery = db
      .select({
        // Session fields
        id: replaySessions.id,
        projectId: replaySessions.projectId,
        userId: replaySessions.userId,
        startedAt: replaySessions.startedAt,
        endedAt: replaySessions.endedAt,
        duration: replaySessions.duration,
        url: replaySessions.url,
        userAgent: replaySessions.userAgent,
        deviceType: replaySessions.deviceType,
        browser: replaySessions.browser,
        os: replaySessions.os,
        createdAt: replaySessions.createdAt,
        // Aggregated error info
        errorCount: sql<number>`COUNT(DISTINCT ${errorEvents.id})`.as("error_count"),
        severityRank: severityRank.as("severity_rank"),
        errorFingerprints: sql<string>`STRING_AGG(DISTINCT ${errorEvents.fingerprint}::text, ',')`.as("error_fingerprints"),
      })
      .from(replaySessions)
      .leftJoin(errorEvents, eq(errorEvents.sessionId, replaySessions.id))
      .where(and(...conditions))
      .groupBy(replaySessions.id);

    // Apply HAVING clause for error count and severity filters
    let havingConditions: ReturnType<typeof sql>[] = [];

    if (filters.errorCountMin !== undefined) {
      havingConditions.push(sql`COUNT(DISTINCT ${errorEvents.id}) >= ${filters.errorCountMin}`);
    }

    if (filters.severity) {
      const severityValue = { fatal: 5, error: 4, warning: 3, info: 2, debug: 1 }[filters.severity];
      havingConditions.push(sql`${severityRank} = ${severityValue}`);
    }

    // Get total count for pagination (before HAVING)
    const countQuery = db
      .select({ count: sql<number>`COUNT(DISTINCT ${replaySessions.id})` })
      .from(replaySessions)
      .leftJoin(errorEvents, eq(errorEvents.sessionId, replaySessions.id))
      .where(and(...conditions));

    // Execute count query
    const totalResult = (await countQuery)[0];
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Build final query with sorting and pagination
    let finalQuery;
    if (havingConditions.length > 0) {
      finalQuery = db
        .select({
          id: replaySessions.id,
          projectId: replaySessions.projectId,
          userId: replaySessions.userId,
          startedAt: replaySessions.startedAt,
          endedAt: replaySessions.endedAt,
          duration: replaySessions.duration,
          url: replaySessions.url,
          userAgent: replaySessions.userAgent,
          deviceType: replaySessions.deviceType,
          browser: replaySessions.browser,
          os: replaySessions.os,
          createdAt: replaySessions.createdAt,
          errorCount: sql<number>`COUNT(DISTINCT ${errorEvents.id})`.as("error_count"),
          severityRank: severityRank.as("severity_rank"),
          errorFingerprints: sql<string>`STRING_AGG(DISTINCT ${errorEvents.fingerprint}::text, ',')`.as("error_fingerprints"),
        })
        .from(replaySessions)
        .leftJoin(errorEvents, eq(errorEvents.sessionId, replaySessions.id))
        .where(and(...conditions))
        .groupBy(replaySessions.id)
        .having(and(...havingConditions))
        .orderBy(desc(replaySessions.startedAt))
        .limit(limit)
        .offset(offset);
    } else {
      finalQuery = db
        .select({
          id: replaySessions.id,
          projectId: replaySessions.projectId,
          userId: replaySessions.userId,
          startedAt: replaySessions.startedAt,
          endedAt: replaySessions.endedAt,
          duration: replaySessions.duration,
          url: replaySessions.url,
          userAgent: replaySessions.userAgent,
          deviceType: replaySessions.deviceType,
          browser: replaySessions.browser,
          os: replaySessions.os,
          createdAt: replaySessions.createdAt,
          errorCount: sql<number>`COUNT(DISTINCT ${errorEvents.id})`.as("error_count"),
          severityRank: severityRank.as("severity_rank"),
          errorFingerprints: sql<string>`STRING_AGG(DISTINCT ${errorEvents.fingerprint}::text, ',')`.as("error_fingerprints"),
        })
        .from(replaySessions)
        .leftJoin(errorEvents, eq(errorEvents.sessionId, replaySessions.id))
        .where(and(...conditions))
        .groupBy(replaySessions.id)
        .orderBy(desc(replaySessions.startedAt))
        .limit(limit)
        .offset(offset);
    }

    const sessions = await finalQuery;

    // Map severity rank back to level name and parse fingerprints
    const severityMap: Record<number, string> = { 5: "fatal", 4: "error", 3: "warning", 2: "info", 1: "debug" };

    const mappedSessions = sessions.map(s => ({
      ...s,
      maxSeverity: severityMap[s.severityRank] || null,
      errorFingerprints: s.errorFingerprints ? s.errorFingerprints.split(",") : [],
    }));

    // Get device distribution stats
    const statsQuery = await db
      .select({
        deviceType: replaySessions.deviceType,
        count: sql<number>`COUNT(*)`,
      })
      .from(replaySessions)
      .where(eq(replaySessions.projectId, projectId))
      .groupBy(replaySessions.deviceType)
      ;

    const stats = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      totalErrors: 0,
    };

    for (const row of statsQuery) {
      if (row.deviceType === "desktop") stats.desktop = row.count;
      else if (row.deviceType === "mobile") stats.mobile = row.count;
      else if (row.deviceType === "tablet") stats.tablet = row.count;
    }

    // Count total errors
    const totalErrorsResult = (await db
      .select({ count: sql<number>`COUNT(DISTINCT ${errorEvents.id})` })
      .from(errorEvents)
      .innerJoin(replaySessions, eq(errorEvents.sessionId, replaySessions.id))
      .where(eq(replaySessions.projectId, projectId)))[0];

    stats.totalErrors = totalErrorsResult?.count || 0;

    return c.json({
      sessions: mappedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid sessions filter input", { issues: e.issues });
      return c.json({ error: "Invalid filter parameters", code: "VALIDATION_ERROR", details: e.issues }, 400);
    }

    logger.error("Failed to list sessions with errors", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};

export const handleErrorReplay = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = errorReplaySchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    // Import queue dynamically to avoid circular dependencies
    const { replayQueue } = await import("../../queue/queues");
    const { isRedisAvailable } = await import("../../queue/connection");

    // Check Redis availability
    const redisUp = await isRedisAvailable();
    if (!redisUp) {
      logger.error("Redis unavailable, cannot queue replay");
      return c.json(
        { error: "Service temporarily unavailable", code: "SERVICE_UNAVAILABLE" },
        503
      );
    }

    // Queue replay for async processing
    await replayQueue.add("process-replay", {
      projectId,
      sessionId: input.sessionId,
      events: input.events,
      error: {
        message: input.error.message,
        file: input.error.file || undefined,
        line: input.error.line || undefined,
        stack: input.error.stack || undefined,
        level: input.error.level,
      },
      url: input.url || null,
      userAgent: input.userAgent || null,
      timestamp: input.timestamp,
      release: input.release || null,
    });

    logger.debug("Replay queued", {
      sessionId: input.sessionId,
      projectId,
      hasEvents: !!input.events,
    });

    // Respond immediately with 202 Accepted
    return c.json({
      success: true,
      queued: true,
      sessionId: input.sessionId,
    }, 202);

  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid error replay input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR", details: e.issues }, 400);
    }

    logger.error("Failed to queue error replay", {
      error: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return c.json({
      error: isDev && e instanceof Error ? e.message : "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
};
