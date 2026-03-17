import { CronRepository } from "../repositories/CronRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { MemberRepository } from "../repositories/MemberRepository";
import { triggerAlertsForCronError } from "./alerts";
import logger from "../logger";

// cron-parser v5 uses named exports
import { CronExpressionParser } from "cron-parser";

// ============================================
// Helpers
// ============================================

/**
 * Compute the next expected execution time for a cron schedule.
 */
export function computeNextExpected(schedule: string, timezone: string): Date | null {
  try {
    const interval = CronExpressionParser.parse(schedule, {
      tz: timezone,
    });
    return interval.next().toDate();
  } catch (err) {
    logger.warn("Failed to parse cron schedule", { schedule, err });
    return null;
  }
}

/**
 * Verify that the calling user has access to the given project.
 * Throws an error with a descriptive message on failure.
 */
async function assertProjectAccess(projectId: string, userId: string): Promise<{ name: string }> {
  const project = await ProjectRepository.findByIdWithOrg(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const member = await MemberRepository.findMemberByOrgAndUser(project.organizationId, userId);
  if (!member) {
    throw new Error("Access denied");
  }

  return project;
}

// ============================================
// Checkin processing (SDK endpoint)
// ============================================

export type CheckinStatus = "ok" | "in_progress" | "error";

export interface CheckinInput {
  slug: string;
  status: CheckinStatus;
  checkinId?: string;
  duration?: number;
  env?: string;
  payload?: unknown;
}

export const CronService = {
  /**
   * Process a checkin from a monitored cron job.
   * Auto-creates the monitor if it does not exist yet.
   */
  processCheckin: async (projectId: string, input: CheckinInput) => {
    const now = new Date();

    // 1. Lookup monitor by (projectId, slug) — auto-create if missing
    let monitor = await CronRepository.findMonitorByProjectAndSlug(projectId, input.slug);

    if (!monitor) {
      monitor = await CronRepository.createMonitor({
        id: crypto.randomUUID(),
        projectId,
        name: input.slug,
        slug: input.slug,
        schedule: null,
        timezone: "UTC",
        toleranceMinutes: 5,
        status: "active",
        env: input.env ?? null,
        createdAt: now,
        updatedAt: now,
      });
      logger.info("Auto-created cron monitor", { slug: input.slug, projectId });
    }

    // 2. Handle in_progress — insert a new checkin and return the correlation id
    if (input.status === "in_progress") {
      const newCheckinId = input.checkinId ?? crypto.randomUUID();
      const checkin = await CronRepository.createCheckin({
        id: crypto.randomUUID(),
        monitorId: monitor.id,
        status: "in_progress",
        env: input.env ?? null,
        checkinId: newCheckinId,
        payload: input.payload ?? null,
        startedAt: now,
        createdAt: now,
      });

      // Update monitor last checkin status
      await CronRepository.updateMonitor(monitor.id, {
        lastCheckinAt: now,
        lastCheckinStatus: "in_progress",
        updatedAt: now,
      });

      logger.info("Cron checkin started", {
        monitorId: monitor.id,
        checkinId: newCheckinId,
      });

      return { checkin, checkinId: newCheckinId };
    }

    // 3. Handle ok / error
    let checkin;

    if (input.checkinId) {
      // Try to find and update the matching in_progress row
      const existing = await CronRepository.findCheckinByCheckinId(input.checkinId);

      if (existing) {
        const duration =
          input.duration ??
          (existing.startedAt ? now.getTime() - existing.startedAt.getTime() : null);

        await CronRepository.updateCheckin(existing.id, {
          status: input.status,
          duration: duration ?? null,
          finishedAt: now,
        });

        checkin = { ...existing, status: input.status, duration, finishedAt: now };
      }
    }

    if (!checkin) {
      // Standalone checkin (no prior in_progress row)
      checkin = await CronRepository.createCheckin({
        id: crypto.randomUUID(),
        monitorId: monitor.id,
        status: input.status,
        duration: input.duration ?? null,
        env: input.env ?? null,
        checkinId: input.checkinId ?? null,
        payload: input.payload ?? null,
        finishedAt: now,
        createdAt: now,
      });
    }

    // 4. Recompute nextExpectedAt using cron-parser
    const nextExpectedAt = monitor.schedule
      ? computeNextExpected(monitor.schedule, monitor.timezone)
      : null;

    await CronRepository.updateMonitor(monitor.id, {
      lastCheckinAt: now,
      lastCheckinStatus: input.status,
      nextExpectedAt: nextExpectedAt ?? undefined,
      updatedAt: now,
    });

    // 5. Trigger alert on error
    if (input.status === "error") {
      await triggerAlertsForCronError(projectId, monitor.name, monitor.slug, "error");
    }

    logger.info("Cron checkin completed", {
      monitorId: monitor.id,
      status: input.status,
    });

    return { checkin };
  },

  // ============================================
  // Dashboard methods (with access checks)
  // ============================================

  listMonitors: async (projectId: string, userId: string) => {
    await assertProjectAccess(projectId, userId);
    return CronRepository.findMonitorsByProject(projectId);
  },

  getMonitor: async (monitorId: string, userId: string) => {
    const monitor = await CronRepository.findMonitorById(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }
    await assertProjectAccess(monitor.projectId, userId);
    return monitor;
  },

  createMonitor: async (
    userId: string,
    data: {
      projectId: string;
      name: string;
      slug: string;
      schedule?: string | null;
      timezone?: string;
      toleranceMinutes?: number;
      env?: string | null;
    }
  ) => {
    await assertProjectAccess(data.projectId, userId);

    const now = new Date();
    const timezone = data.timezone ?? "UTC";
    const nextExpectedAt =
      data.schedule ? computeNextExpected(data.schedule, timezone) : null;

    return CronRepository.createMonitor({
      id: crypto.randomUUID(),
      projectId: data.projectId,
      name: data.name,
      slug: data.slug,
      schedule: data.schedule ?? null,
      timezone,
      toleranceMinutes: data.toleranceMinutes ?? 5,
      status: "active",
      env: data.env ?? null,
      createdAt: now,
      updatedAt: now,
      // nextExpectedAt is set via updateMonitor after creation
    }).then(async (monitor) => {
      if (nextExpectedAt) {
        await CronRepository.updateMonitor(monitor.id, {
          nextExpectedAt,
          updatedAt: now,
        });
        return { ...monitor, nextExpectedAt };
      }
      return monitor;
    });
  },

  updateMonitor: async (
    userId: string,
    monitorId: string,
    data: Partial<{
      name: string;
      slug: string;
      schedule: string | null;
      timezone: string;
      toleranceMinutes: number;
      status: string;
      env: string | null;
    }>
  ) => {
    const monitor = await CronRepository.findMonitorById(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }
    await assertProjectAccess(monitor.projectId, userId);

    const now = new Date();
    const timezone = data.timezone ?? monitor.timezone;
    const schedule = "schedule" in data ? data.schedule : monitor.schedule;
    const nextExpectedAt = schedule ? computeNextExpected(schedule, timezone) : null;

    await CronRepository.updateMonitor(monitorId, {
      ...data,
      nextExpectedAt: nextExpectedAt ?? undefined,
      updatedAt: now,
    });

    return CronRepository.findMonitorById(monitorId);
  },

  deleteMonitor: async (userId: string, monitorId: string) => {
    const monitor = await CronRepository.findMonitorById(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }
    await assertProjectAccess(monitor.projectId, userId);
    await CronRepository.deleteMonitor(monitorId);
    return { success: true };
  },

  getCheckins: async (
    monitorId: string,
    userId: string,
    page: number,
    limit: number
  ) => {
    const monitor = await CronRepository.findMonitorById(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }
    await assertProjectAccess(monitor.projectId, userId);

    const offset = (page - 1) * limit;
    const [checkins, total] = await Promise.all([
      CronRepository.getCheckins(monitorId, limit, offset),
      CronRepository.countCheckins(monitorId),
    ]);

    return { checkins, total, page, limit };
  },

  getTimeline: async (monitorId: string, userId: string) => {
    const monitor = await CronRepository.findMonitorById(monitorId);
    if (!monitor) {
      throw new Error("Monitor not found");
    }
    await assertProjectAccess(monitor.projectId, userId);

    const checkins = await CronRepository.getTimeline(monitorId, 30);

    // Group by day
    const byDay: Record<string, { date: string; ok: number; error: number; missed: number }> = {};
    for (const c of checkins) {
      const day = c.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) {
        byDay[day] = { date: day, ok: 0, error: 0, missed: 0 };
      }
      if (c.status === "ok") byDay[day].ok++;
      else if (c.status === "error") byDay[day].error++;
      else if (c.status === "missed") byDay[day].missed++;
    }

    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  },
};
