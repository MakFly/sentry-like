import { Hono } from "hono";
import { stream } from "hono/streaming";
import { Redis } from "ioredis";
import { and, eq } from "drizzle-orm";
import { db } from "../db/connection";
import { organizationMembers } from "../db/schema";
import logger from "../logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const sse = new Hono();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      await subClient.subscribe(`sse:org:${orgId}`);
    } catch (err) {
      logger.warn("SSE subscribe failed", { orgId, error: err });
      await subClient.quit();
      return;
    }

    subClient.on("message", (_channel, message) => {
      if (closed) return;
      stream.write(toSseFrame("update", message)).catch(() => {
        closed = true;
      });
    });

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      if (closed) return;
      stream.write(toSseFrame("ping", "")).catch(() => {
        closed = true;
      });
    }, 15_000);

    // Cleanup on disconnect
    stream.onAbort(() => {
      closed = true;
      clearInterval(pingInterval);
      subClient.unsubscribe().catch(() => {});
      subClient.quit().catch(() => {});
    });

    // Keep the stream open
    while (!closed) {
      await wait(30_000);
    }
  });
});

export default sse;
