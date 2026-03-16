import { Hono } from "hono";
import { Redis } from "ioredis";
import { and, eq } from "drizzle-orm";
import { db } from "../db/connection";
import { organizationMembers } from "../db/schema";
import logger from "../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const sse = new Hono();
const encoder = new TextEncoder();

function toSseFrame(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

sse.get("/:orgId", async (c) => {
  const session = c.get("session" as never) as { user?: { id: string } } | undefined;
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const userId = session.user.id;

  const orgId = c.req.param("orgId");

  // Verify user belongs to this org
  const membership = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return c.json({ error: "Forbidden" }, 403);
  }

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
        await subClient.subscribe(`sse:org:${orgId}`);
      } catch (err) {
        logger.warn("SSE subscribe failed", { orgId, error: err });
        await cleanup();
        controller.close();
        return;
      }

      onMessage = (_channel, message) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(toSseFrame("update", message)));
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

export default sse;
