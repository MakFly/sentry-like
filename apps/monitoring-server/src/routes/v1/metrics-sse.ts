import { Hono } from "hono";
import { stream } from "hono/streaming";
import { Redis } from "ioredis";
import { apiKeyMiddleware } from "../../middleware/api-key";
import logger from "../../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toSseFrame(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

const metricsSse = new Hono();

metricsSse.get("/:projectId", apiKeyMiddleware, async (c) => {
  const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
  const projectId = apiKeyData?.projectId || null;

  if (!projectId) {
    return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
  }

  const requestedProjectId = c.req.param("projectId");
  if (projectId !== requestedProjectId) {
    return c.json({ error: "Forbidden - project mismatch", code: "FORBIDDEN" }, 403);
  }

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return stream(c, async (stream) => {
    const subClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    let closed = false;

    try {
      await subClient.subscribe(`sse:metrics:${projectId}`);
    } catch (err) {
      logger.warn("Metrics SSE subscribe failed", { projectId, error: err });
      await subClient.quit();
      return;
    }

    subClient.on("message", (_channel, message) => {
      if (closed) return;
      stream.write(toSseFrame("metrics", message)).catch(() => {
        closed = true;
      });
    });

    const pingInterval = setInterval(() => {
      if (closed) return;
      stream.write(toSseFrame("ping", "")).catch(() => {
        closed = true;
      });
    }, 15_000);

    stream.onAbort(() => {
      closed = true;
      clearInterval(pingInterval);
      subClient.unsubscribe().catch(() => {});
      subClient.quit().catch(() => {});
    });

    while (!closed) {
      await wait(30_000);
    }
  });
});

export default metricsSse;
