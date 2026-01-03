/**
 * Alert Worker
 * @description Processes alert notifications from the queue
 */
import { Worker, Job } from "bullmq";
import { redisConnection } from "../connection";
import { type AlertJobData } from "../queues";
import { triggerAlertsForNewError } from "../../services/alerts";
import logger from "../../logger";

const WORKER_CONCURRENCY = parseInt(process.env.ALERT_WORKER_CONCURRENCY || "5", 10);

/**
 * Process a single alert job
 */
async function processAlert(job: Job<AlertJobData>): Promise<{ processed: boolean }> {
  const { projectId, fingerprint, isNewGroup, level, message } = job.data;

  logger.debug("Processing alert job", {
    jobId: job.id,
    projectId,
    fingerprint,
    isNewGroup,
  });

  // Use existing alert service
  await triggerAlertsForNewError(projectId, fingerprint, isNewGroup);

  return { processed: true };
}

/**
 * Alert worker instance
 */
export const alertWorker = new Worker<AlertJobData>(
  "alerts",
  processAlert,
  {
    ...redisConnection,
    concurrency: WORKER_CONCURRENCY,
    limiter: {
      max: 100,
      duration: 60000, // Max 100 alerts per minute (rate limiting)
    },
  }
);

alertWorker.on("completed", (job) => {
  logger.debug("Alert job completed", { jobId: job.id });
});

alertWorker.on("failed", (job, err) => {
  logger.error("Alert job failed", {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

alertWorker.on("error", (err) => {
  logger.error("Alert worker error", { error: err.message });
});

export default alertWorker;
