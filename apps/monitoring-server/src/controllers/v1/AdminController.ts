import type { Context } from "hono";
import { AdminService } from "../../services/AdminService";
import type { PlanType } from "../../types/services";
import { aggregationQueue, type AggregationJobType } from "../../queue/queues";
import {
  aggregateHourlyMetrics,
  aggregateHourlyTransactions,
  aggregateDailyFromHourly,
  cleanupExpiredPerformanceData,
  cleanupOldAggregates,
} from "../../services/aggregation";
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

// ============================================
// Cron / Aggregation endpoints
// ============================================

/**
 * GET /admin/cron/status — List all scheduled cron jobs and their status
 */
export const getCronStatus = async (c: Context) => {
  try {
    const repeatableJobs = await aggregationQueue.getRepeatableJobs();
    const waiting = await aggregationQueue.getWaitingCount();
    const active = await aggregationQueue.getActiveCount();
    const completed = await aggregationQueue.getCompletedCount();
    const failed = await aggregationQueue.getFailedCount();
    const delayed = await aggregationQueue.getDelayedCount();

    // Get last 10 completed jobs for history
    const recentJobs = await aggregationQueue.getCompleted(0, 10);

    return c.json({
      scheduledJobs: repeatableJobs.map((job) => ({
        key: job.key,
        name: job.name,
        pattern: job.pattern,
        next: job.next ? new Date(job.next).toISOString() : null,
      })),
      queueStats: { waiting, active, completed, failed, delayed },
      recentHistory: recentJobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        returnvalue: job.returnvalue,
        duration: job.finishedOn && job.processedOn
          ? job.finishedOn - job.processedOn
          : null,
      })),
    });
  } catch (error) {
    logger.error("Failed to get cron status", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * POST /admin/cron/trigger — Manually trigger an aggregation job
 * Body: { type: "aggregate-hourly" | "aggregate-daily" | "cleanup-expired", targetDate?: "2025-01-15" }
 */
export const triggerCronJob = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { type, targetDate } = body as { type?: AggregationJobType; targetDate?: string };

    const validTypes: AggregationJobType[] = ["aggregate-hourly", "aggregate-daily", "cleanup-expired"];
    if (!type || !validTypes.includes(type)) {
      return c.json({
        error: "Invalid job type",
        validTypes,
        usage: {
          type: "aggregate-hourly | aggregate-daily | cleanup-expired",
          targetDate: "optional, ISO date string (default: yesterday)",
        },
      }, 400);
    }

    // Add job to queue for async processing
    const job = await aggregationQueue.add(`manual-${type}`, {
      type,
      targetDate: targetDate || undefined,
    }, {
      jobId: `manual-${type}-${Date.now()}`,
    });

    logger.info("Cron job triggered manually", { type, targetDate, jobId: job.id });

    return c.json({
      success: true,
      jobId: job.id,
      type,
      targetDate: targetDate || "yesterday (default)",
      message: `Job queued. Check GET /admin/cron/status for progress.`,
    });
  } catch (error) {
    logger.error("Failed to trigger cron job", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * POST /admin/cron/run-sync — Run an aggregation job synchronously (blocks until done)
 * Body: { type: "aggregate-hourly" | "aggregate-daily" | "cleanup-expired", targetDate?: "2025-01-15" }
 * Use for debugging or one-off runs. For production, use /trigger (async).
 */
export const runCronSync = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { type, targetDate: rawDate } = body as { type?: string; targetDate?: string };

    const date = rawDate
      ? new Date(rawDate)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

    const startTime = Date.now();

    switch (type) {
      case "aggregate-hourly": {
        const metrics = await aggregateHourlyMetrics(date);
        const transactions = await aggregateHourlyTransactions(date);
        return c.json({
          success: true,
          type,
          date: date.toISOString().split("T")[0],
          result: { metrics, transactions },
          durationMs: Date.now() - startTime,
        });
      }

      case "aggregate-daily": {
        const result = await aggregateDailyFromHourly(date);
        return c.json({
          success: true,
          type,
          date: date.toISOString().split("T")[0],
          result,
          durationMs: Date.now() - startTime,
        });
      }

      case "cleanup-expired": {
        const perfCleanup = await cleanupExpiredPerformanceData(30);
        const aggregateCleanup = await cleanupOldAggregates(12);
        return c.json({
          success: true,
          type,
          result: { performance: perfCleanup, aggregates: aggregateCleanup },
          durationMs: Date.now() - startTime,
        });
      }

      default:
        return c.json({
          error: "Invalid job type",
          validTypes: ["aggregate-hourly", "aggregate-daily", "cleanup-expired"],
          usage: {
            type: "aggregate-hourly | aggregate-daily | cleanup-expired",
            targetDate: "optional, ISO date (default: yesterday)",
          },
        }, 400);
    }
  } catch (error) {
    logger.error("Failed to run cron sync", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * GET /admin/cron/failed — Get recent failed jobs for debugging
 */
export const getFailedCronJobs = async (c: Context) => {
  try {
    const failedJobs = await aggregationQueue.getFailed(0, 20);

    return c.json(failedJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      stacktrace: job.stacktrace?.slice(0, 3), // First 3 stack frames
    })));
  } catch (error) {
    logger.error("Failed to get failed cron jobs", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * DELETE /admin/cron/failed — Clear all failed jobs
 */
export const clearFailedCronJobs = async (c: Context) => {
  try {
    const failedCount = await aggregationQueue.getFailedCount();
    await aggregationQueue.clean(0, 0, "failed");
    logger.info("Cleared failed cron jobs", { count: failedCount });
    return c.json({ success: true, cleared: failedCount });
  } catch (error) {
    logger.error("Failed to clear failed cron jobs", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

