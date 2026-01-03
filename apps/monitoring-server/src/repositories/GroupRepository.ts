import { eq, gt, desc, inArray, and, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { errorGroups, errorEvents } from "../db/schema";

export const GroupRepository = {
  findAll: async (filters?: { dateRange?: string; env?: string }, projectId?: string) => {
    const now = Date.now();
    let startDate = new Date(0);

    if (filters?.dateRange && filters.dateRange !== "all") {
      const hours =
        filters.dateRange === "24h"
          ? 24
          : filters.dateRange === "7d"
            ? 24 * 7
            : filters.dateRange === "30d"
              ? 24 * 30
              : 24 * 90;
      startDate = new Date(now - hours * 60 * 60 * 1000);
    }

    const projectFilter = projectId ? eq(errorGroups.projectId, projectId) : undefined;

    if (filters?.env && filters.env !== "all") {
      const eventEnvFilter = projectId
        ? and(eq(errorEvents.env, filters.env), eq(errorEvents.projectId, projectId))
        : eq(errorEvents.env, filters.env);

      const eventsWithEnv = await db
        .select({ fingerprint: errorEvents.fingerprint })
        .from(errorEvents)
        .where(eventEnvFilter)
        .groupBy(errorEvents.fingerprint);

      const distinctFingerprints = eventsWithEnv.map((row) => row.fingerprint);

      if (distinctFingerprints.length === 0) {
        return [];
      }

      const groups = await db
        .select()
        .from(errorGroups)
        .where(
          and(
            inArray(errorGroups.fingerprint, distinctFingerprints),
            projectFilter,
            gt(errorGroups.lastSeen, startDate)
          )
        )
        .orderBy(desc(errorGroups.lastSeen));

      const fingerprints = groups.map((g) => g.fingerprint);

      const replayCounts = await db
        .select({
          fingerprint: errorEvents.fingerprint,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(errorEvents)
        .where(
          and(
            inArray(errorEvents.fingerprint, fingerprints),
            sql`${errorEvents.sessionId} IS NOT NULL`
          )
        )
        .groupBy(errorEvents.fingerprint)
        ;

      // Get latest replay info for each fingerprint
      const latestReplayEvents = await db
        .select({
          fingerprint: errorEvents.fingerprint,
          sessionId: errorEvents.sessionId,
          errorEventId: errorEvents.id,
          createdAt: errorEvents.createdAt,
        })
        .from(errorEvents)
        .where(
          and(
            inArray(errorEvents.fingerprint, fingerprints),
            sql`${errorEvents.sessionId} IS NOT NULL`
          )
        )
        .orderBy(desc(errorEvents.createdAt))
        ;

      const latestReplayMap = new Map<string, { sessionId: string; errorEventId: string; createdAt: Date }>();
      for (const event of latestReplayEvents) {
        if (!latestReplayMap.has(event.fingerprint) && event.sessionId) {
          latestReplayMap.set(event.fingerprint, {
            sessionId: event.sessionId,
            errorEventId: event.errorEventId,
            createdAt: event.createdAt,
          });
        }
      }

      const replayCountMap = new Map(replayCounts.map((r) => [r.fingerprint, r.count]));

      return groups.map((group) => {
        const replayInfo = latestReplayMap.get(group.fingerprint);
        return {
          ...group,
          hasReplay: (replayCountMap.get(group.fingerprint) ?? 0) > 0,
          latestReplaySessionId: replayInfo?.sessionId ?? null,
          latestReplayEventId: replayInfo?.errorEventId ?? null,
          latestReplayCreatedAt: replayInfo?.createdAt ?? null,
        };
      });
    }

    const whereCondition = projectFilter
      ? and(projectFilter, gt(errorGroups.lastSeen, startDate))
      : gt(errorGroups.lastSeen, startDate);

    const groups = await db.select().from(errorGroups).where(whereCondition).orderBy(desc(errorGroups.lastSeen));

    const fingerprints = groups.map((g) => g.fingerprint);

    const replayCounts = fingerprints.length > 0
      ? await db
        .select({
          fingerprint: errorEvents.fingerprint,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(errorEvents)
        .where(
          and(
            inArray(errorEvents.fingerprint, fingerprints),
            sql`${errorEvents.sessionId} IS NOT NULL`
          )
        )
        .groupBy(errorEvents.fingerprint)
        
      : [];

    // Get latest replay info for each fingerprint (for direct replay links)
    const latestReplayEvents = fingerprints.length > 0
      ? await db
        .select({
          fingerprint: errorEvents.fingerprint,
          sessionId: errorEvents.sessionId,
          errorEventId: errorEvents.id,
          createdAt: errorEvents.createdAt,
        })
        .from(errorEvents)
        .where(
          and(
            inArray(errorEvents.fingerprint, fingerprints),
            sql`${errorEvents.sessionId} IS NOT NULL`
          )
        )
        .orderBy(desc(errorEvents.createdAt))
        
      : [];

    // Keep only the latest for each fingerprint
    const latestReplayMap = new Map<string, { sessionId: string; errorEventId: string; createdAt: Date }>();
    for (const event of latestReplayEvents) {
      if (!latestReplayMap.has(event.fingerprint) && event.sessionId) {
        latestReplayMap.set(event.fingerprint, {
          sessionId: event.sessionId,
          errorEventId: event.errorEventId,
          createdAt: event.createdAt,
        });
      }
    }

    const replayCountMap = new Map(replayCounts.map((r) => [r.fingerprint, r.count]));

    return groups.map((group) => {
      const replayInfo = latestReplayMap.get(group.fingerprint);
      return {
        ...group,
        hasReplay: (replayCountMap.get(group.fingerprint) ?? 0) > 0,
        latestReplaySessionId: replayInfo?.sessionId ?? null,
        latestReplayEventId: replayInfo?.errorEventId ?? null,
        latestReplayCreatedAt: replayInfo?.createdAt ?? null,
      };
    });
  },

  findByFingerprint: (fingerprint: string) =>
    db.select().from(errorGroups).where(eq(errorGroups.fingerprint, fingerprint)).then(rows => rows[0]),

  updateStatus: (fingerprint: string, status: string, resolvedBy: string | null) =>
    db
      .update(errorGroups)
      .set({
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
        resolvedBy: status === "resolved" ? resolvedBy : null,
      })
      .where(eq(errorGroups.fingerprint, fingerprint))
      .returning(),

  updateAssignment: (fingerprint: string, assignedTo: string | null) =>
    db
      .update(errorGroups)
      .set({
        assignedTo,
        assignedAt: assignedTo ? new Date() : null,
      })
      .where(eq(errorGroups.fingerprint, fingerprint))
      .returning(),

  getReleaseDistribution: async (fingerprint: string) => {
    const releases = await db
      .select({
        release: errorEvents.release,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(errorEvents)
      .where(eq(errorEvents.fingerprint, fingerprint))
      .groupBy(errorEvents.release)
      .orderBy(desc(sql`count(*)`));

    // Get total count for percentage calculation
    const total = releases.reduce((sum, r) => sum + r.count, 0);

    // Get the first event to determine "first seen in" release
    const firstEvent = await db
      .select({ release: errorEvents.release })
      .from(errorEvents)
      .where(eq(errorEvents.fingerprint, fingerprint))
      .orderBy(errorEvents.createdAt)
      .limit(1);

    return {
      releases: releases.map((r) => ({
        version: r.release || "unknown",
        count: r.count,
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      })),
      firstSeenIn: firstEvent[0]?.release || null,
    };
  },
};

