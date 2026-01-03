import type { AuthContext } from "../../types/context";
import {
  getGlobal,
  getTimeline,
  getEnvBreakdown as getEnvBreakdownService,
  getDashboardStats as getDashboardStatsService,
} from "../../services/stats";
import type { TimelineRange } from "../../types/services";
import { verifyProjectAccess } from "../../services/project-access";
import logger from "../../logger";

export const getGlobalStats = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId") as string | undefined;

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access stats without project permission", { userId, projectId });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/stats", { projectId });
  const stats = await getGlobal(projectId);
  return c.json(stats);
};

export const getDashboardStats = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId") as string | undefined;

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access dashboard stats without project permission", { userId, projectId });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/stats/dashboard", { projectId });
  const stats = await getDashboardStatsService(projectId);
  return c.json(stats);
};

export const getTimelineStats = async (c: AuthContext) => {
  const userId = c.get("userId");
  const range = c.req.query("range") as TimelineRange | undefined;
  const projectId = c.req.query("projectId") as string | undefined;

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access timeline stats without project permission", { userId, projectId });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/stats/timeline", { range, projectId });
  const timeline = await getTimeline(range || "30d", projectId);
  return c.json(timeline);
};

export const getEnvBreakdown = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId") as string | undefined;

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      logger.warn("User attempted to access env breakdown without project permission", { userId, projectId });
      return c.json({ error: "Forbidden: You don't have access to this project" }, 403);
    }
  }

  logger.debug("GET /api/v1/stats/env-breakdown", { projectId });
  const breakdown = await getEnvBreakdownService(projectId);
  return c.json(breakdown);
};

