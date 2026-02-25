import { Hono } from "hono";
import { Redis } from "ioredis";
import { apiKeyMiddleware } from "../../middleware/api-key";
import logger from "../../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const encoder = new TextEncoder();

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

  const subClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  });

  let closed = false;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let onMessage: ((channel: string, message: string) => void) | null = null;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (pingInterval) clearInterval(pingInterval);
    if (onMessage) subClient.off("message", onMessage);
    await subClient.unsubscribe().catch(() => {});
    await subClient.quit().catch(() => {});
  };

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await subClient.subscribe(`sse:metrics:${projectId}`);
      } catch (err) {
        logger.warn("Metrics SSE subscribe failed", { projectId, error: err });
        await cleanup();
        controller.close();
        return;
      }

      onMessage = (_channel, message) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(toSseFrame("metrics", message)));
        } catch {
          void cleanup();
        }
      };
      subClient.on("message", onMessage);

      pingInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(toSseFrame("ping", "")));
        } catch {
          void cleanup();
        }
      }, 15_000);

      c.req.raw.signal?.addEventListener(
        "abort",
        () => {
          void cleanup();
          try {
            controller.close();
          } catch {}
        },
        { once: true }
      );
    },
    async cancel() {
      await cleanup();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

export default metricsSse;
