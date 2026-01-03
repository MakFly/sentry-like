import { db } from "../db/connection";
import { errorEvents, errorGroups, notifications } from "../db/schema";
import { lt, eq, and, sql } from "drizzle-orm";
import logger from "../logger";
import type { RetentionStats } from "../types/services";

// Default retention periods (in days)
const DEFAULT_EVENT_RETENTION_DAYS = 30;
const DEFAULT_NOTIFICATION_RETENTION_DAYS = 90;

/**
 * Clean up old error events based on retention policy
 */
export async function cleanupOldEvents(retentionDays: number = DEFAULT_EVENT_RETENTION_DAYS): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  logger.info("Starting event cleanup", { retentionDays, cutoffDate: cutoffDate.toISOString() });

  // Delete old events
  const result = await db
    .delete(errorEvents)
    .where(lt(errorEvents.createdAt, cutoffDate));

  // Get count of deleted rows (SQLite returns changes in result)
  const deletedCount = (result as { changes?: number }).changes || 0;

  logger.info("Event cleanup completed", { deletedCount });
  return deletedCount;
}

/**
 * Clean up error groups that have no remaining events
 */
export async function cleanupOrphanedGroups(): Promise<number> {
  logger.info("Starting orphaned group cleanup");

  // Find groups with no events
  const orphanedGroups = await db.all(sql`
    SELECT eg.fingerprint
    FROM error_groups eg
    LEFT JOIN error_events ee ON eg.fingerprint = ee.fingerprint
    WHERE ee.id IS NULL
  `);

  if (orphanedGroups.length === 0) {
    logger.info("No orphaned groups found");
    return 0;
  }

  // Delete orphaned groups
  for (const group of orphanedGroups) {
    await db
      .delete(errorGroups)
      .where(eq(errorGroups.fingerprint, (group as { fingerprint: string }).fingerprint));
  }

  logger.info("Orphaned group cleanup completed", { deletedCount: orphanedGroups.length });
  return orphanedGroups.length;
}

/**
 * Clean up old notifications
 */
export async function cleanupOldNotifications(retentionDays: number = DEFAULT_NOTIFICATION_RETENTION_DAYS): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  logger.info("Starting notification cleanup", { retentionDays, cutoffDate: cutoffDate.toISOString() });

  const result = await db
    .delete(notifications)
    .where(lt(notifications.createdAt, cutoffDate));

  const deletedCount = (result as { changes?: number }).changes || 0;

  logger.info("Notification cleanup completed", { deletedCount });
  return deletedCount;
}

/**
 * Run full retention cleanup
 */
export async function runRetentionCleanup(
  eventRetentionDays: number = DEFAULT_EVENT_RETENTION_DAYS,
  notificationRetentionDays: number = DEFAULT_NOTIFICATION_RETENTION_DAYS
): Promise<RetentionStats> {
  logger.info("Starting full retention cleanup", {
    eventRetentionDays,
    notificationRetentionDays,
  });

  const eventsDeleted = await cleanupOldEvents(eventRetentionDays);
  const groupsDeleted = await cleanupOrphanedGroups();
  const notificationsDeleted = await cleanupOldNotifications(notificationRetentionDays);

  const stats: RetentionStats = {
    eventsDeleted,
    groupsDeleted,
    notificationsDeleted,
  };

  logger.info("Full retention cleanup completed", {
    eventsDeleted: stats.eventsDeleted,
    groupsDeleted: stats.groupsDeleted,
    notificationsDeleted: stats.notificationsDeleted,
  });
  return stats;
}

/**
 * Update event counts for all groups after cleanup
 */
export async function updateGroupCounts(): Promise<void> {
  logger.info("Updating group event counts");

  await db.run(sql`
    UPDATE error_groups
    SET count = (
      SELECT COUNT(*)
      FROM error_events
      WHERE error_events.fingerprint = error_groups.fingerprint
    )
  `);

  logger.info("Group counts updated");
}

/**
 * Get retention statistics without deleting
 */
export async function getRetentionStats(retentionDays: number = DEFAULT_EVENT_RETENTION_DAYS): Promise<{
  eventsToDelete: number;
  oldestEvent: Date | null;
  newestEvent: Date | null;
}> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const countResult = await db.get(sql`
    SELECT COUNT(*) as count
    FROM error_events
    WHERE created_at < ${cutoffDate.getTime()}
  `);

  const oldestResult = await db.get(sql`
    SELECT MIN(created_at) as oldest
    FROM error_events
  `);

  const newestResult = await db.get(sql`
    SELECT MAX(created_at) as newest
    FROM error_events
  `);

  return {
    eventsToDelete: (countResult as { count: number })?.count || 0,
    oldestEvent: (oldestResult as { oldest: number })?.oldest
      ? new Date((oldestResult as { oldest: number }).oldest)
      : null,
    newestEvent: (newestResult as { newest: number })?.newest
      ? new Date((newestResult as { newest: number }).newest)
      : null,
  };
}
