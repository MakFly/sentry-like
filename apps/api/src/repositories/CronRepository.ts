import { eq, and, desc, gte, sql, isNotNull } from "drizzle-orm";
import { db } from "../db/connection";
import { cronMonitors, cronCheckins } from "../db/schema";

export const CronRepository = {
  findMonitorByProjectAndSlug: (projectId: string, slug: string) =>
    db
      .select()
      .from(cronMonitors)
      .where(and(eq(cronMonitors.projectId, projectId), eq(cronMonitors.slug, slug)))
      .then((rows) => rows[0]),

  findMonitorById: (id: string) =>
    db.select().from(cronMonitors).where(eq(cronMonitors.id, id)).then((rows) => rows[0]),

  findMonitorsByProject: (projectId: string) =>
    db
      .select()
      .from(cronMonitors)
      .where(eq(cronMonitors.projectId, projectId))
      .orderBy(desc(cronMonitors.createdAt)),

  createMonitor: (data: {
    id: string;
    projectId: string;
    name: string;
    slug: string;
    schedule?: string | null;
    timezone: string;
    toleranceMinutes: number;
    status: string;
    env?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) =>
    db.insert(cronMonitors).values(data).returning().then((rows) => rows[0]),

  updateMonitor: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      schedule: string | null;
      timezone: string;
      toleranceMinutes: number;
      status: string;
      lastCheckinAt: Date | null;
      lastCheckinStatus: string | null;
      nextExpectedAt: Date | null;
      env: string | null;
      updatedAt: Date;
    }>
  ) => db.update(cronMonitors).set(data).where(eq(cronMonitors.id, id)),

  deleteMonitor: (id: string) => db.delete(cronMonitors).where(eq(cronMonitors.id, id)),

  createCheckin: (data: {
    id: string;
    monitorId: string;
    status: string;
    duration?: number | null;
    env?: string | null;
    checkinId?: string | null;
    payload?: unknown;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    createdAt: Date;
  }) =>
    db.insert(cronCheckins).values(data).returning().then((rows) => rows[0]),

  updateCheckin: (
    id: string,
    data: Partial<{
      status: string;
      duration: number | null;
      finishedAt: Date | null;
    }>
  ) => db.update(cronCheckins).set(data).where(eq(cronCheckins.id, id)),

  findCheckinByCheckinId: (checkinId: string) =>
    db
      .select()
      .from(cronCheckins)
      .where(and(eq(cronCheckins.checkinId, checkinId), eq(cronCheckins.status, "in_progress")))
      .then((rows) => rows[0]),

  getCheckins: (monitorId: string, limit: number, offset: number) =>
    db
      .select()
      .from(cronCheckins)
      .where(eq(cronCheckins.monitorId, monitorId))
      .orderBy(desc(cronCheckins.createdAt))
      .limit(limit)
      .offset(offset),

  countCheckins: (monitorId: string) =>
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cronCheckins)
      .where(eq(cronCheckins.monitorId, monitorId))
      .then((rows) => rows[0]?.count ?? 0),

  getTimeline: (monitorId: string, days: number) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return db
      .select()
      .from(cronCheckins)
      .where(and(eq(cronCheckins.monitorId, monitorId), gte(cronCheckins.createdAt, since)))
      .orderBy(desc(cronCheckins.createdAt));
  },

  findOverdueMonitors: () =>
    db
      .select()
      .from(cronMonitors)
      .where(
        and(
          isNotNull(cronMonitors.schedule),
          eq(cronMonitors.status, "active"),
          isNotNull(cronMonitors.nextExpectedAt),
          // nextExpectedAt + toleranceMinutes < NOW()
          sql`${cronMonitors.nextExpectedAt} + (${cronMonitors.toleranceMinutes} * interval '1 minute') < NOW()`
        )
      ),
};
