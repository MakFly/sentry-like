/**
 * Metrics Controller
 * @description Handles metrics ingestion from the Go agent
 */
import type { Context } from "hono";
import { z } from "zod";
import logger from "../../logger";
import { canAcceptEvent } from "../../services/quotas";
import { getProjectPlan } from "../../services/subscriptions";
import { metricsQueue } from "../../queue/queues";
import { isRedisAvailable, redis } from "../../queue/connection";
import { ProjectSettingsRepository } from "../../repositories/ProjectSettingsRepository";

const isProduction = process.env.NODE_ENV === "production";

const cpuMetricsSchema = z.object({
  user: z.number(),
  system: z.number(),
  idle: z.number(),
  iowait: z.number().optional(),
  steal: z.number().optional(),
  nice: z.number().optional(),
});

const memoryMetricsSchema = z.object({
  total: z.number(),
  used: z.number(),
  free: z.number(),
  available: z.number(),
  cached: z.number().optional(),
  buffers: z.number().optional(),
  swapTotal: z.number().optional(),
  swapUsed: z.number().optional(),
  swapFree: z.number().optional(),
});

const diskMetricsSchema = z.object({
  device: z.string(),
  mountPoint: z.string(),
  total: z.number(),
  used: z.number(),
  free: z.number(),
  inodesTotal: z.number().optional(),
  inodesUsed: z.number().optional(),
  inodesFree: z.number().optional(),
  readBytes: z.number().optional(),
  writeBytes: z.number().optional(),
});

const networkMetricsSchema = z.object({
  interface: z.string(),
  rxBytes: z.number(),
  txBytes: z.number(),
  rxPackets: z.number().optional(),
  txPackets: z.number().optional(),
  rxErrors: z.number().optional(),
  txErrors: z.number().optional(),
  rxDropped: z.number().optional(),
  txDropped: z.number().optional(),
});

const systemMetricsSchema = z.object({
  hostname: z.string(),
  timestamp: z.number(),
  os: z.string(),
  osVersion: z.string().optional(),
  architecture: z.string().optional(),
  cpu: cpuMetricsSchema,
  memory: memoryMetricsSchema,
  disks: z.array(diskMetricsSchema).optional(),
  networks: z.array(networkMetricsSchema).optional(),
});

const metricsPayloadSchema = z.object({
  hostId: z.string(),
  hostname: z.string(),
  metrics: systemMetricsSchema,
  tags: z.record(z.string()).optional(),
});

export const ingest = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = metricsPayloadSchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId || null;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    const projectSettings = await ProjectSettingsRepository.findByProjectId(projectId);
    if (projectSettings && projectSettings.eventsEnabled === false) {
      logger.info("Metrics rejected - ingestion disabled", { projectId });
      return c.json(
        { error: "Metrics ingestion disabled", code: "INGESTION_DISABLED" },
        403
      );
    }

    const plan = await getProjectPlan(projectId);
    const quotaCheck = await canAcceptEvent(projectId, plan);
    if (!quotaCheck.allowed) {
      logger.warn("Metrics rejected due to quota", { projectId, reason: quotaCheck.reason });
      return c.json(
        { error: "Quota exceeded", code: "QUOTA_EXCEEDED", message: quotaCheck.reason },
        429
      );
    }

    const redisUp = await isRedisAvailable();
    if (!redisUp) {
      logger.error("Redis unavailable, cannot queue metrics");
      return c.json({ error: "Service temporarily unavailable", code: "SERVICE_UNAVAILABLE" }, 503);
    }

    const jobId = `metrics-${projectId}-${input.hostId}-${Math.floor(input.metrics.timestamp / 60000)}`;

    await metricsQueue.add("process-metrics", {
      projectId,
      hostId: input.hostId,
      hostname: input.hostname,
      os: input.metrics.os,
      osVersion: input.metrics.osVersion,
      architecture: input.metrics.architecture,
      cpu: JSON.stringify(input.metrics.cpu),
      memory: JSON.stringify(input.metrics.memory),
      disks: input.metrics.disks ? JSON.stringify(input.metrics.disks) : null,
      networks: input.metrics.networks ? JSON.stringify(input.metrics.networks) : null,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      timestamp: new Date(input.metrics.timestamp).toISOString(),
    }, { jobId });

    logger.debug("Metrics queued", {
      projectId,
      hostId: input.hostId,
      hostname: input.hostname,
    });

    return c.json({ success: true, queued: true }, 202);

  } catch (e) {
    if (e instanceof z.ZodError) {
      if (isProduction) {
        logger.warn("Invalid metrics input", { fieldCount: e.issues.length });
        return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
      }

      logger.warn("Invalid metrics input", {
        issues: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      return c.json(
        {
          error: "Invalid input",
          code: "VALIDATION_ERROR",
          details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        400
      );
    }

    logger.error("Failed to queue metrics", {
      error: e instanceof Error ? e.message : "Unknown error",
    });

    return c.json(
      { error: isProduction ? "Internal server error" : (e instanceof Error ? e.message : "Unknown error"), code: "INTERNAL_ERROR" },
      500
    );
  }
};
