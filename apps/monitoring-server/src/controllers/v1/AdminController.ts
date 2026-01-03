import type { Context } from "hono";
import { AdminService } from "../../services/AdminService";
import type { PlanType } from "../../types/services";
import logger from "../../logger";

export const getRetentionStats = async (c: Context) => {
  const retentionDays = parseInt(c.req.query("days") || "30", 10);
  try {
    const stats = await AdminService.getRetentionStats(retentionDays);
    return c.json(stats);
  } catch (error) {
    logger.error("Failed to get retention stats", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const runRetentionCleanup = async (c: Context) => {
  const { eventRetentionDays = 30, notificationRetentionDays = 90 } =
    await c.req.json().catch(() => ({}));
  try {
    const stats = await AdminService.runRetentionCleanup(
      eventRetentionDays,
      notificationRetentionDays
    );
    return c.json({ success: true, stats });
  } catch (error) {
    logger.error("Failed to run retention cleanup", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const updateGroupCounts = async (c: Context) => {
  try {
    const result = await AdminService.updateGroupCounts();
    return c.json(result);
  } catch (error) {
    logger.error("Failed to update group counts", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const getProjectQuota = async (c: Context) => {
  const projectId = c.req.param("projectId");
  const plan = (c.req.query("plan") || "free") as PlanType;
  try {
    const status = await AdminService.getProjectQuota(projectId, plan);
    return c.json(status);
  } catch (error) {
    logger.error("Failed to get quota status", { error, projectId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const getOrganizationQuota = async (c: Context) => {
  const organizationId = c.req.param("organizationId");
  const plan = (c.req.query("plan") || "free") as PlanType;
  try {
    const usage = await AdminService.getOrganizationQuota(organizationId, plan);
    return c.json(usage);
  } catch (error) {
    logger.error("Failed to get organization quota", { error, organizationId });
    return c.json({ error: "Internal server error" }, 500);
  }
};

