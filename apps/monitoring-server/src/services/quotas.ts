import { db } from "../db/connection";
import { errorEvents, projects } from "../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import logger from "../logger";

import type { QuotaStatus, PlanType } from "../types/services";
// Default quotas per plan
export const PLAN_QUOTAS = {
  free: {
    eventsPerMonth: 5000,
    retentionDays: 7,
    projects: 1,
    organizations: 1,
    users: 1,
  },
  pro: {
    eventsPerMonth: 100000,
    retentionDays: 30,
    projects: -1, // unlimited
    organizations: -1,
    users: 5,
  },
  team: {
    eventsPerMonth: 500000,
    retentionDays: 90,
    projects: -1,
    organizations: -1,
    users: -1,
  },
  enterprise: {
    eventsPerMonth: -1, // unlimited
    retentionDays: 365,
    projects: -1,
    organizations: -1,
    users: -1,
  },
};

/**
 * Get the start of the current billing month
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get current month's event count for a project
 */
export async function getMonthlyEventCount(projectId: string): Promise<number> {
  const monthStart = getMonthStart();

  const result = (await db
    .select({ count: sql<number>`count(*)` })
    .from(errorEvents)
    .where(
      and(
        eq(errorEvents.projectId, projectId),
        gte(errorEvents.createdAt, monthStart)
      )
    ))[0];

  return result?.count || 0;
}

/**
 * Check quota status for a project
 */
export async function checkQuotaStatus(
  projectId: string,
  plan: PlanType = "free"
): Promise<QuotaStatus> {
  const used = await getMonthlyEventCount(projectId);
  const limit = PLAN_QUOTAS[plan].eventsPerMonth;

  // Unlimited quota
  if (limit === -1) {
    return {
      used,
      limit: -1,
      percentage: 0,
      exceeded: false,
      remaining: -1,
    };
  }

  const percentage = Math.round((used / limit) * 100);
  const exceeded = used >= limit;
  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    percentage,
    exceeded,
    remaining,
  };
}

/**
 * Check if an event can be accepted (quota not exceeded)
 */
export async function canAcceptEvent(
  projectId: string,
  plan: PlanType = "free"
): Promise<{ allowed: boolean; reason?: string; status: QuotaStatus }> {
  const status = await checkQuotaStatus(projectId, plan);

  if (status.exceeded) {
    logger.warn("Quota exceeded for project", { projectId, used: status.used, limit: status.limit });
    return {
      allowed: false,
      reason: `Monthly quota exceeded (${status.used}/${status.limit} events)`,
      status,
    };
  }

  // Warn when approaching limit (80%)
  if (status.percentage >= 80) {
    logger.info("Approaching quota limit", { projectId, percentage: status.percentage });
  }

  return { allowed: true, status };
}

/**
 * Get quota usage for all projects in an organization
 */
export async function getOrganizationQuotaUsage(
  organizationId: string,
  plan: PlanType = "free"
): Promise<{
  totalUsed: number;
  projectUsage: Array<{ projectId: string; projectName: string; used: number }>;
}> {
  const monthStart = getMonthStart();

  // Get all projects for the organization
  const orgProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.organizationId, organizationId));

  const projectUsage: Array<{ projectId: string; projectName: string; used: number }> = [];
  let totalUsed = 0;

  for (const project of orgProjects) {
    const count = await getMonthlyEventCount(project.id);
    projectUsage.push({
      projectId: project.id,
      projectName: project.name,
      used: count,
    });
    totalUsed += count;
  }

  return { totalUsed, projectUsage };
}
