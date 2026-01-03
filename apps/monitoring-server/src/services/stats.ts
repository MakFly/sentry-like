import { sql, gte, eq, count, and, desc } from "drizzle-orm";
import { db } from "../db/connection";
import { errorGroups, errorEvents } from "../db/schema";
import type { Stats, DashboardStats, TimelinePoint, EnvBreakdown, TimelineRange } from "../types/services";

export const getGlobal = async (projectId?: string): Promise<Stats> => {
  const projectFilter = projectId ? eq(errorGroups.projectId, projectId) : undefined;

  const [groupsResult, eventsResult] = await Promise.all([
    db.select({ count: count() }).from(errorGroups).where(projectFilter),
    db.select({ total: sql<number>`coalesce(sum(${errorGroups.count}), 0)` })
      .from(errorGroups)
      .where(projectFilter),
  ]);

  const totalGroups = groupsResult[0]?.count || 0;
  const totalEvents = Number(eventsResult[0]?.total) || 0;

  return {
    totalGroups,
    totalEvents,
    avgEventsPerGroup: totalGroups > 0 ? totalEvents / totalGroups : 0,
  };
};

export const getDashboardStats = async (projectId?: string): Promise<DashboardStats> => {
  const groupsProjectFilter = projectId ? eq(errorGroups.projectId, projectId) : undefined;
  const eventsProjectFilter = projectId ? eq(errorEvents.projectId, projectId) : undefined;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const eventsTodayFilter = eventsProjectFilter
    ? and(eventsProjectFilter, gte(errorEvents.createdAt, today))
    : gte(errorEvents.createdAt, today);

  const newIssuesFilter = groupsProjectFilter
    ? and(groupsProjectFilter, gte(errorGroups.firstSeen, yesterday))
    : gte(errorGroups.firstSeen, yesterday);

  const [totalGroupsResult, totalEventsResult, eventsTodayResult, newIssues24hResult] =
    await Promise.all([
      db.select({ count: count() }).from(errorGroups).where(groupsProjectFilter),
      db.select({ total: sql<number>`coalesce(sum(${errorGroups.count}), 0)` })
        .from(errorGroups)
        .where(groupsProjectFilter),
      db.select({ count: count() }).from(errorEvents).where(eventsTodayFilter),
      db.select({ count: count() }).from(errorGroups).where(newIssuesFilter),
    ]);

  const totalGroups = totalGroupsResult[0]?.count || 0;
  const totalEvents = Number(totalEventsResult[0]?.total) || 0;

  return {
    totalGroups,
    totalEvents,
    avgEventsPerGroup: totalGroups > 0 ? totalEvents / totalGroups : 0,
    todayEvents: eventsTodayResult[0]?.count || 0,
    newIssues24h: newIssues24hResult[0]?.count || 0,
    avgResponse: "—",
  };
};

export const getTimeline = async (
  range: TimelineRange = "30d",
  projectId?: string
): Promise<TimelinePoint[]> => {
  const now = new Date();
  let daysBack: number;
  let dateFormat: string;
  let intervalMs: number;

  switch (range) {
    case "24h":
      daysBack = 1;
      dateFormat = "YYYY-MM-DD HH24:00";
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case "7d":
      daysBack = 7;
      dateFormat = "YYYY-MM-DD";
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "30d":
    default:
      daysBack = 30;
      dateFormat = "YYYY-MM-DD";
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
  }

  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // Build conditions
  const eventsConditions = [gte(errorEvents.createdAt, startDate)];
  const groupsConditions = [gte(errorGroups.firstSeen, startDate)];

  if (projectId) {
    eventsConditions.push(eq(errorEvents.projectId, projectId));
    groupsConditions.push(eq(errorGroups.projectId, projectId));
  }

  // Query events timeline - use GROUP BY 1 to reference SELECT column by position
  const startDateStr = startDate.toISOString();
  const eventsTimeline = await db.execute<{ date: string; count: string }>(
    sql`SELECT to_char(created_at, ${dateFormat}) as date, COUNT(*)::text as count
        FROM error_events
        WHERE created_at >= ${startDateStr}::timestamptz ${projectId ? sql`AND project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 1`
  );

  // Query groups timeline
  const groupsTimeline = await db.execute<{ date: string; count: string }>(
    sql`SELECT to_char(first_seen, ${dateFormat}) as date, COUNT(*)::text as count
        FROM error_groups
        WHERE first_seen >= ${startDateStr}::timestamptz ${projectId ? sql`AND project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 1`
  );

  // Build date map with all expected dates
  const dateMap = new Map<string, TimelinePoint>();
  const numIntervals = range === "24h" ? 24 : daysBack + 1;

  for (let i = 0; i < numIntervals; i++) {
    const d = new Date(startDate.getTime() + i * intervalMs);
    const dateKey = range === "24h"
      ? d.toISOString().slice(0, 13).replace("T", " ") + ":00"
      : d.toISOString().slice(0, 10);
    dateMap.set(dateKey, { date: dateKey, events: 0, groups: 0 });
  }

  // Merge query results (db.execute returns rows array)
  const eventsRows = eventsTimeline.rows || eventsTimeline;
  for (const row of eventsRows) {
    const existing = dateMap.get(row.date);
    if (existing) {
      existing.events = parseInt(row.count, 10) || 0;
    }
  }

  const groupsRows = groupsTimeline.rows || groupsTimeline;
  for (const row of groupsRows) {
    const existing = dateMap.get(row.date);
    if (existing) {
      existing.groups = parseInt(row.count, 10) || 0;
    }
  }

  return Array.from(dateMap.values());
};

export const getEnvBreakdown = async (projectId?: string): Promise<EnvBreakdown[]> => {
  const conditions = projectId ? eq(errorEvents.projectId, projectId) : undefined;

  const result = await db
    .select({
      env: errorEvents.env,
      count: count(),
    })
    .from(errorEvents)
    .where(conditions)
    .groupBy(errorEvents.env)
    .orderBy(desc(count()));

  return result;
};
