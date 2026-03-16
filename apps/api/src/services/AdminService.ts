import {
  runRetentionCleanup,
  getRetentionStats,
  updateGroupCounts,
} from "./retention";
import { checkQuotaStatus, getOrganizationQuotaUsage } from "./quotas";
import type { PlanType } from "../types/services";
import logger from "../logger";

const ADMIN_KEY = process.env.ADMIN_API_KEY;

export const AdminService = {
  verifyAdminKey: (providedKey: string | undefined) => {
    if (!ADMIN_KEY) {
      throw new Error("Admin API not configured");
    }
    if (providedKey !== ADMIN_KEY) {
      throw new Error("Unauthorized");
    }
  },

  getRetentionStats: async (days: number = 30) => {
    return await getRetentionStats(days);
  },

  runRetentionCleanup: async (eventRetentionDays: number = 30, notificationRetentionDays: number = 90) => {
    logger.info("Admin triggered retention cleanup", { eventRetentionDays, notificationRetentionDays });
    const stats = await runRetentionCleanup(eventRetentionDays, notificationRetentionDays);
    await updateGroupCounts();
    return stats;
  },

  updateGroupCounts: async () => {
    await updateGroupCounts();
    return { success: true };
  },

  getProjectQuota: async (projectId: string, plan: PlanType = "free") => {
    return await checkQuotaStatus(projectId, plan);
  },

  getOrganizationQuota: async (organizationId: string, plan: PlanType = "free") => {
    return await getOrganizationQuotaUsage(organizationId, plan);
  },
};

