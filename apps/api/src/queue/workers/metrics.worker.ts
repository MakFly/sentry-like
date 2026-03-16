/**
 * Metrics Worker
 * @description Processes system metrics from the queue
 */
import { Worker } from "bullmq";
import { redisConnection } from "../connection";
import { metricsQueue, type MetricsJobData } from "../queues";
import { db } from "../../db/connection";
import { systemMetrics } from "../../db/schema";
import logger from "../../logger";
import { eventsReceived } from "../../metrics";
import { publishMetrics } from "../../sse/publisher";

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "10", 10);

export function createMetricsWorker() {
  return new Worker<MetricsJobData>(
    "metrics",
    async (job) => {
      const startTime = Date.now();

      try {
        const {
          projectId,
          hostId,
          hostname,
          os,
          osVersion,
          architecture,
          cpu,
          memory,
          disks,
          networks,
          tags,
          timestamp,
        } = job.data;

        await db.insert(systemMetrics).values({
          id: crypto.randomUUID(),
          projectId,
          hostId,
          hostname,
          os,
          osVersion: osVersion || null,
          architecture: architecture || null,
          cpu: JSON.parse(cpu),
          memory: JSON.parse(memory),
          disks: disks ? JSON.parse(disks) : null,
          networks: networks ? JSON.parse(networks) : null,
          tags: tags ? JSON.parse(tags) : null,
          timestamp: new Date(timestamp),
        });

        eventsReceived.inc({ project_id: projectId, level: "info" });

        await publishMetrics(projectId, {
          hostId,
          hostname,
          os,
          osVersion: osVersion || null,
          architecture: architecture || null,
          cpu: JSON.parse(cpu),
          memory: JSON.parse(memory),
          disks: disks ? JSON.parse(disks) : null,
          networks: networks ? JSON.parse(networks) : null,
          tags: tags ? JSON.parse(tags) : null,
          timestamp,
        });

        const duration = Date.now() - startTime;
        logger.debug("Metrics processed", {
          projectId,
          hostId,
          hostname,
          duration,
        });

        return { success: true };
      } catch (error) {
        logger.error("Failed to process metrics", {
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
        });
        throw error;
      }
    },
    {
      ...redisConnection,
      concurrency: WORKER_CONCURRENCY,
    }
  );
}

export const metricsWorker = createMetricsWorker();
