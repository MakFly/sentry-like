/**
 * Performance Controller
 * @description Handles performance metrics and transactions from SDKs
 */
import type { Context } from "hono";
import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { db } from "../../db/connection";
import { performanceMetrics, transactions, spans } from "../../db/schema";
import { verifyProjectAccess } from "../../services/project-access";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import logger from "../../logger";

// === Validation Schemas ===

const metricSchema = z.object({
  type: z.enum(["web_vitals", "page_load", "custom"]),
  name: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().max(20).optional(),
  url: z.string().max(2000).optional(),
  tags: z.record(z.string()).optional(),
  timestamp: z.number(),
  sessionId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
});

const spanSchema = z.object({
  id: z.string(),
  parentSpanId: z.string().optional(),
  op: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.string().max(20).optional(),
  startTimestamp: z.number(),
  endTimestamp: z.number(),
  data: z.record(z.any()).optional(),
});

const transactionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  op: z.string().min(1).max(100),
  traceId: z.string().optional(),
  parentSpanId: z.string().optional(),
  status: z.enum(["ok", "error", "cancelled"]).optional(),
  startTimestamp: z.number(),
  endTimestamp: z.number(),
  spans: z.array(spanSchema).optional(),
  tags: z.record(z.string()).optional(),
  data: z.record(z.any()).optional(),
});

const metricsPayloadSchema = z.object({
  metrics: z.array(metricSchema).max(100),
  env: z.string().max(50).default("production"),
});

const transactionPayloadSchema = z.object({
  transaction: transactionSchema,
  env: z.string().max(50).default("production"),
});

/**
 * Submit performance metrics from SDK
 */
export const submitMetrics = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = metricsPayloadSchema.parse(rawInput);

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    logger.debug("Received performance metrics", {
      count: input.metrics.length,
      projectId,
      env: input.env,
    });

    const now = new Date();

    // Insert all metrics
    for (const metric of input.metrics) {
      await db.insert(performanceMetrics).values({
        id: crypto.randomUUID(),
        projectId,
        type: metric.type,
        name: metric.name,
        value: Math.round(metric.value), // Store as integer
        unit: metric.unit || null,
        url: metric.url || null,
        env: input.env,
        tags: metric.tags ? JSON.stringify(metric.tags) : null,
        timestamp: new Date(metric.timestamp),
        sessionId: metric.sessionId || null,
        userId: metric.userId || null,
        createdAt: now,
      });
    }

    logger.info("Stored performance metrics", {
      count: input.metrics.length,
      projectId,
    });

    return c.json({ success: true, count: input.metrics.length });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid performance metrics input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
    }

    logger.error("Failed to submit performance metrics", {
      error: e instanceof Error ? e.message : "Unknown error",
    });

    return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
  }
};

/**
 * Submit a transaction from SDK
 */
export const submitTransaction = async (c: Context) => {
  try {
    const rawInput = await c.req.json();
    const input = transactionPayloadSchema.parse(rawInput);
    const { transaction } = input;

    const apiKeyData = (c as any).get("apiKey") as { id: string; projectId: string } | undefined;
    const projectId = apiKeyData?.projectId;

    if (!projectId) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    const now = new Date();
    const duration = transaction.endTimestamp - transaction.startTimestamp;

    // Insert transaction
    await db.insert(transactions).values({
      id: transaction.id,
      projectId,
      name: transaction.name,
      op: transaction.op,
      traceId: transaction.traceId || null,
      parentSpanId: transaction.parentSpanId || null,
      status: transaction.status || null,
      duration,
      startTimestamp: new Date(transaction.startTimestamp),
      endTimestamp: new Date(transaction.endTimestamp),
      tags: transaction.tags ? JSON.stringify(transaction.tags) : null,
      data: transaction.data ? JSON.stringify(transaction.data) : null,
      env: input.env,
      createdAt: now,
    });

    // Insert spans if any
    if (transaction.spans && transaction.spans.length > 0) {
      for (const span of transaction.spans) {
        const spanDuration = span.endTimestamp - span.startTimestamp;
        await db.insert(spans).values({
          id: span.id,
          transactionId: transaction.id,
          parentSpanId: span.parentSpanId || null,
          op: span.op,
          description: span.description || null,
          status: span.status || null,
          duration: spanDuration,
          startTimestamp: new Date(span.startTimestamp),
          endTimestamp: new Date(span.endTimestamp),
          data: span.data ? JSON.stringify(span.data) : null,
        });
      }
    }

    logger.info("Stored transaction", {
      transactionId: transaction.id,
      name: transaction.name,
      op: transaction.op,
      spanCount: transaction.spans?.length || 0,
      projectId,
    });

    return c.json({ success: true, transactionId: transaction.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.warn("Invalid transaction input", { issues: e.issues });
      return c.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, 400);
    }

    logger.error("Failed to submit transaction", {
      error: e instanceof Error ? e.message : "Unknown error",
    });

    return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
  }
};

/**
 * Get performance metrics (dashboard)
 */
export const getMetrics = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");
  const type = c.req.query("type") as string | undefined;
  const name = c.req.query("name") as string | undefined;
  const dateRange = c.req.query("dateRange") as "24h" | "7d" | "30d" | undefined;

  if (!projectId) {
    return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
  }

  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  // Build date filter
  let startDate: Date | undefined;
  if (dateRange) {
    const now = new Date();
    if (dateRange === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateRange === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Build conditions array - all filters must be combined
  const conditions = [eq(performanceMetrics.projectId, projectId)];

  if (type) {
    conditions.push(eq(performanceMetrics.type, type));
  }

  if (name) {
    conditions.push(eq(performanceMetrics.name, name));
  }

  if (startDate) {
    conditions.push(gte(performanceMetrics.timestamp, startDate));
  }

  // Query metrics with all conditions combined
  const metrics = await db
    .select()
    .from(performanceMetrics)
    .where(and(...conditions))
    .orderBy(desc(performanceMetrics.timestamp))
    .limit(500)
    ;

  return c.json(metrics);
};

/**
 * Get Web Vitals summary
 */
export const getWebVitalsSummary = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");
  const dateRange = c.req.query("dateRange") as "24h" | "7d" | "30d" | undefined;

  if (!projectId) {
    return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
  }

  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  // Build date filter
  let startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (dateRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get aggregated Web Vitals
  const vitals = await db
    .select({
      name: performanceMetrics.name,
      avg: sql<number>`avg(${performanceMetrics.value})`,
      p50: sql<number>`avg(${performanceMetrics.value})`, // Approximation
      p75: sql<number>`avg(${performanceMetrics.value}) * 1.1`, // Approximation
      p95: sql<number>`max(${performanceMetrics.value})`,
      count: sql<number>`count(*)`,
    })
    .from(performanceMetrics)
    .where(
      and(
        eq(performanceMetrics.projectId, projectId),
        eq(performanceMetrics.type, "web_vitals"),
        gte(performanceMetrics.timestamp, startDate)
      )
    )
    .groupBy(performanceMetrics.name)
    ;

  // Define thresholds for good/needs improvement/poor
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 100, needsImprovement: 250 }, // Stored as score * 1000
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 },
  };

  const summary = vitals.map((vital) => {
    const threshold = thresholds[vital.name];
    let status: "good" | "needs-improvement" | "poor" = "good";

    if (threshold) {
      if (vital.avg >= threshold.needsImprovement) {
        status = "poor";
      } else if (vital.avg >= threshold.good) {
        status = "needs-improvement";
      }
    }

    return {
      name: vital.name,
      avg: Math.round(vital.avg),
      p50: Math.round(vital.p50),
      p75: Math.round(vital.p75),
      p95: Math.round(vital.p95),
      count: vital.count,
      status,
      threshold: threshold || null,
    };
  });

  return c.json(summary);
};

/**
 * Get transactions (dashboard)
 */
export const getTransactions = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");
  const op = c.req.query("op") as string | undefined;
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);

  if (!projectId) {
    return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
  }

  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const offset = (page - 1) * limit;

  // Build conditions array
  const conditions = [eq(transactions.projectId, projectId)];

  if (op) {
    conditions.push(eq(transactions.op, op));
  }

  const results = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.startTimestamp))
    .limit(limit)
    .offset(offset)
    ;

  // Get total count with same filters
  const countResult = (await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(...conditions)))[0];

  return c.json({
    transactions: results,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    },
  });
};

/**
 * Get transaction with spans
 */
export const getTransaction = async (c: AuthContext) => {
  const userId = c.get("userId");
  const transactionId = c.req.param("id");

  const transaction = (await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId)))[0];

  if (!transaction) {
    return c.json({ error: "Transaction not found", code: "NOT_FOUND" }, 404);
  }

  const hasAccess = await verifyProjectAccess(transaction.projectId, userId);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const transactionSpans = await db
    .select()
    .from(spans)
    .where(eq(spans.transactionId, transactionId))
    .orderBy(spans.startTimestamp)
    ;

  return c.json({
    ...transaction,
    spans: transactionSpans,
  });
};

/**
 * Get slowest transactions summary
 */
export const getSlowestTransactions = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");
  const dateRange = c.req.query("dateRange") as "24h" | "7d" | "30d" | undefined;

  if (!projectId) {
    return c.json({ error: "projectId required", code: "MISSING_PROJECT_ID" }, 400);
  }

  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  let startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (dateRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const slowest = await db
    .select({
      name: transactions.name,
      op: transactions.op,
      avgDuration: sql<number>`avg(${transactions.duration})`,
      maxDuration: sql<number>`max(${transactions.duration})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.projectId, projectId),
        gte(transactions.startTimestamp, startDate)
      )
    )
    .groupBy(transactions.name, transactions.op)
    .orderBy(sql`avg(${transactions.duration}) DESC`)
    .limit(10)
    ;

  return c.json(slowest.map((t) => ({
    name: t.name,
    op: t.op,
    avgDuration: Math.round(t.avgDuration),
    maxDuration: t.maxDuration,
    count: t.count,
  })));
};
