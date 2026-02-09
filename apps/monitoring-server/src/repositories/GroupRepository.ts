import { eq, gt, desc, asc, inArray, and, sql, ilike, or } from "drizzle-orm";
import { db } from "../db/connection";
import { errorGroups, errorEvents } from "../db/schema";

export const GroupRepository = {
  findAll: async (filters?: { dateRange?: string; env?: string; search?: string; status?: string; level?: string; sort?: string; page?: number; limit?: number }, projectId?: string) => {
    const now = Date.now();
    let startDate = new Date(0);
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

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

    // Build conditions array
    const conditions: any[] = [];

    if (projectId) {
      conditions.push(eq(errorGroups.projectId, projectId));
    }

    conditions.push(gt(errorGroups.lastSeen, startDate));

    // Exclude merged groups (they are absorbed into parent)
    conditions.push(sql`${errorGroups.mergedInto} IS NULL`);

    // Auto-reopen snoozed issues past their snooze time
    await db.execute(sql`
      UPDATE error_groups SET status = 'open', snoozed_until = NULL, snoozed_by = NULL
      WHERE status = 'snoozed' AND snoozed_until IS NOT NULL AND snoozed_until < NOW()
    `);

    // Search filter
    if (filters?.search) {
      conditions.push(
        or(
          ilike(errorGroups.message, `%${filters.search}%`),
          ilike(errorGroups.file, `%${filters.search}%`)
        )
      );
    }

    // Status filter
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(errorGroups.status, filters.status));
    }

    // Level filter
    if (filters?.level && filters.level !== "all") {
      conditions.push(eq(errorGroups.level, filters.level));
    }

    // Environment filter via error_events join
    let envFingerprints: string[] | null = null;
    if (filters?.env && filters.env !== "all") {
      const eventEnvFilter = projectId
        ? and(eq(errorEvents.env, filters.env), eq(errorEvents.projectId, projectId))
        : eq(errorEvents.env, filters.env);

      const eventsWithEnv = await db
        .select({ fingerprint: errorEvents.fingerprint })
        .from(errorEvents)
        .where(eventEnvFilter)
        .groupBy(errorEvents.fingerprint);

      envFingerprints = eventsWithEnv.map((row) => row.fingerprint);

      if (envFingerprints.length === 0) {
        return { groups: [], total: 0, page, totalPages: 0 };
      }

      conditions.push(inArray(errorGroups.fingerprint, envFingerprints));
    }

    const whereClause = and(...conditions);

    // Sort
    const sortColumn = filters?.sort === "firstSeen" ? errorGroups.firstSeen
      : filters?.sort === "count" ? errorGroups.count
      : errorGroups.lastSeen;
    const orderBy = desc(sortColumn);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(errorGroups)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated groups
    const groups = await db
      .select()
      .from(errorGroups)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const fingerprints = groups.map((g) => g.fingerprint);

    // Get replay info
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

    const enrichedGroups = groups.map((group) => {
      const replayInfo = latestReplayMap.get(group.fingerprint);
      return {
        ...group,
        hasReplay: (replayCountMap.get(group.fingerprint) ?? 0) > 0,
        latestReplaySessionId: replayInfo?.sessionId ?? null,
        latestReplayEventId: replayInfo?.errorEventId ?? null,
        latestReplayCreatedAt: replayInfo?.createdAt ?? null,
      };
    });

    return { groups: enrichedGroups, total, page, totalPages };
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

  batchUpdateStatus: async (fingerprints: string[], status: string, userId?: string) => {
    const result = await db
      .update(errorGroups)
      .set({
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
        resolvedBy: status === "resolved" ? userId || null : null,
      })
      .where(inArray(errorGroups.fingerprint, fingerprints))
      .returning();
    return result.length;
  },

  merge: async (parentFingerprint: string, childFingerprints: string[]) => {
    // Set mergedInto on children
    await db
      .update(errorGroups)
      .set({ mergedInto: parentFingerprint })
      .where(inArray(errorGroups.fingerprint, childFingerprints));

    // Sum up child counts into parent
    const children = await db
      .select({ count: errorGroups.count })
      .from(errorGroups)
      .where(inArray(errorGroups.fingerprint, childFingerprints));

    const totalChildCount = children.reduce((sum, c) => sum + c.count, 0);

    await db
      .update(errorGroups)
      .set({ count: sql`${errorGroups.count} + ${totalChildCount}` })
      .where(eq(errorGroups.fingerprint, parentFingerprint));

    return childFingerprints.length;
  },

  unmerge: async (fingerprint: string) => {
    await db
      .update(errorGroups)
      .set({ mergedInto: null })
      .where(eq(errorGroups.fingerprint, fingerprint));
  },

  getMergedChildren: async (fingerprint: string) => {
    return db
      .select()
      .from(errorGroups)
      .where(eq(errorGroups.mergedInto, fingerprint));
  },

  snooze: async (fingerprint: string, until: Date, userId?: string) => {
    return db
      .update(errorGroups)
      .set({
        status: "snoozed",
        snoozedUntil: until,
        snoozedBy: userId || null,
      })
      .where(eq(errorGroups.fingerprint, fingerprint))
      .returning();
  },

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

