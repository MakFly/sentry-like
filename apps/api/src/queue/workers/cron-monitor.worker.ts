/**
 * Cron Monitor Worker
 * @description Checks for overdue cron monitors and inserts missed checkins
 */
import { Worker, type Job } from "bullmq";
import { redisConnection } from "../connection";
import { cronMonitorQueue, type CronMonitorJobData } from "../queues";
import { CronRepository } from "../../repositories/CronRepository";
import { computeNextExpected } from "../../services/CronService";
import { triggerAlertsForCronError } from "../../services/alerts";
import logger from "../../logger";

/**
 * Process a cron monitor check job.
 */
async function processCronMonitorJob(job: Job<CronMonitorJobData>): Promise<{ missed: number }> {
  if (job.data.type !== "check-missed") {
    throw new Error(`Unknown cron monitor job type: ${job.data.type}`);
  }

  const overdueMonitors = await CronRepository.findOverdueMonitors();
  logger.info("Checking overdue cron monitors", { count: overdueMonitors.length });

  let missed = 0;
  const now = new Date();

  for (const monitor of overdueMonitors) {
    try {
      // Insert a missed checkin
      await CronRepository.createCheckin({
        id: crypto.randomUUID(),
        monitorId: monitor.id,
        status: "missed",
        createdAt: now,
      });

      // Recompute next expected
      const nextExpectedAt = monitor.schedule
        ? computeNextExpected(monitor.schedule, monitor.timezone)
        : null;

      // Update monitor state
      await CronRepository.updateMonitor(monitor.id, {
        lastCheckinStatus: "missed",
        lastCheckinAt: now,
        nextExpectedAt: nextExpectedAt ?? undefined,
        updatedAt: now,
      });

      // Trigger alert
      await triggerAlertsForCronError(monitor.projectId, monitor.name, monitor.slug, "missed");

      missed++;
      logger.warn("Cron monitor missed", {
        monitorId: monitor.id,
        slug: monitor.slug,
        projectId: monitor.projectId,
        nextExpectedAt: monitor.nextExpectedAt,
      });
    } catch (err) {
      logger.error("Failed to process overdue monitor", {
        monitorId: monitor.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { missed };
}

/**
 * Cron monitor worker instance.
 */
export const cronMonitorWorker = new Worker<CronMonitorJobData>(
  "cron-monitor",
  processCronMonitorJob,
  {
    ...redisConnection,
    concurrency: 1,
  }
);

cronMonitorWorker.on("completed", (job, result) => {
  logger.info("Cron monitor job completed", {
    jobId: job.id,
    result,
  });
});

cronMonitorWorker.on("failed", (job, err) => {
  logger.error("Cron monitor job failed", {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

cronMonitorWorker.on("error", (err) => {
  logger.error("Cron monitor worker error", { error: err.message });
});

/**
 * Schedule the recurring missed-checkin detection job.
 * Call once at startup.
 */
export async function scheduleCronMonitorJobs(): Promise<void> {
  // Remove existing repeatable jobs to avoid duplicates
  const existingJobs = await cronMonitorQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await cronMonitorQueue.removeRepeatableByKey(job.key);
  }

  // Run every minute
  await cronMonitorQueue.add(
    "check-missed",
    { type: "check-missed" },
    {
      repeat: { pattern: "* * * * *" },
      jobId: "cron-monitor-check-missed",
    }
  );

  logger.info("Cron monitor job scheduled", { pattern: "* * * * *" });
}

export default cronMonitorWorker;
