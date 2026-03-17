import { z } from "zod";
import { CronService } from "../../services/CronService";
import logger from "../../logger";
import type { AuthContext } from "../../types/context";

// ============================================
// Zod schemas
// ============================================

const checkinSchema = z.object({
  slug: z.string().min(1).max(200),
  status: z.enum(["ok", "in_progress", "error"]),
  checkinId: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  env: z.string().optional(),
  payload: z.unknown().optional(),
});

const createMonitorSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9_-]+$/, "Slug must be lowercase alphanumeric, dashes and underscores only"),
  schedule: z.string().optional().nullable(),
  timezone: z.string().optional(),
  toleranceMinutes: z.number().int().min(0).max(1440).optional(),
  env: z.string().optional().nullable(),
});

const updateMonitorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9_-]+$/).optional(),
  schedule: z.string().optional().nullable(),
  timezone: z.string().optional(),
  toleranceMinutes: z.number().int().min(0).max(1440).optional(),
  status: z.enum(["active", "paused", "disabled"]).optional(),
  env: z.string().optional().nullable(),
});

// ============================================
// SDK endpoint (API key auth)
// ============================================

/**
 * POST /api/v1/cron/checkin
 * SDK endpoint — authenticated via X-API-Key header.
 */
export const checkin = async (c: AuthContext) => {
  const apiKey = c.get("apiKey");
  const projectId = apiKey?.projectId;

  if (!projectId) {
    return c.json({ error: "Invalid API key context" }, 401);
  }

  try {
    const body = await c.req.json();
    const input = checkinSchema.parse(body);
    const result = await CronService.processCheckin(projectId, input);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.issues }, 400);
    }
    logger.error("Failed to process cron checkin", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

// ============================================
// Dashboard endpoints (session auth)
// ============================================

/**
 * GET /api/v1/cron/monitors?projectId=...
 */
export const listMonitors = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");

  if (!projectId) {
    return c.json({ error: "projectId query parameter required" }, 400);
  }

  try {
    const monitors = await CronService.listMonitors(projectId, userId);
    return c.json(monitors);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to list cron monitors", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * GET /api/v1/cron/monitors/:id
 */
export const getMonitor = async (c: AuthContext) => {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  try {
    const monitor = await CronService.getMonitor(monitorId, userId);
    return c.json(monitor);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Monitor not found") {
      return c.json({ error: msg }, 404);
    }
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to get cron monitor", { error, monitorId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * POST /api/v1/cron/monitors
 */
export const createMonitor = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const input = createMonitorSchema.parse(body);
    const monitor = await CronService.createMonitor(userId, input);
    return c.json(monitor, 201);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.issues }, 400);
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to create cron monitor", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * PATCH /api/v1/cron/monitors/:id
 */
export const updateMonitor = async (c: AuthContext) => {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  try {
    const body = await c.req.json();
    const input = updateMonitorSchema.parse(body);
    const monitor = await CronService.updateMonitor(userId, monitorId, input);
    return c.json(monitor);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.issues }, 400);
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Monitor not found") {
      return c.json({ error: msg }, 404);
    }
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to update cron monitor", { error, monitorId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * DELETE /api/v1/cron/monitors/:id
 */
export const deleteMonitor = async (c: AuthContext) => {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  try {
    const result = await CronService.deleteMonitor(userId, monitorId);
    return c.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Monitor not found") {
      return c.json({ error: msg }, 404);
    }
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to delete cron monitor", { error, monitorId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * GET /api/v1/cron/monitors/:id/checkins?page=1&limit=20
 */
export const getCheckins = async (c: AuthContext) => {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));

  try {
    const result = await CronService.getCheckins(monitorId, userId, page, limit);
    return c.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Monitor not found") {
      return c.json({ error: msg }, 404);
    }
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to get cron checkins", { error, monitorId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * GET /api/v1/cron/monitors/:id/timeline
 */
export const getTimeline = async (c: AuthContext) => {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  try {
    const timeline = await CronService.getTimeline(monitorId, userId);
    return c.json(timeline);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Monitor not found") {
      return c.json({ error: msg }, 404);
    }
    if (msg === "Project not found" || msg === "Access denied") {
      return c.json({ error: msg }, 403);
    }
    logger.error("Failed to get cron timeline", { error, monitorId });
    return c.json({ error: "Internal server error" }, 500);
  }
};
