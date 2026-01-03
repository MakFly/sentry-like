import { eq, desc } from "drizzle-orm";
import { db } from "../db/connection";
import { alertRules, notifications } from "../db/schema";

export const AlertRepository = {
  findByProjectId: (projectId: string) =>
    db.select().from(alertRules).where(eq(alertRules.projectId, projectId)),

  findById: (id: string) =>
    db.select().from(alertRules).where(eq(alertRules.id, id)).then(rows => rows[0]),

  create: (data: {
    id: string;
    projectId: string;
    name: string;
    type: string;
    threshold?: number | null;
    windowMinutes?: number | null;
    channel: string;
    config: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) => db.insert(alertRules).values(data).returning().then(rows => rows[0]),

  update: (id: string, data: Partial<{
    name: string;
    type: string;
    threshold: number | null;
    windowMinutes: number | null;
    channel: string;
    config: string;
    enabled: boolean;
    updatedAt: Date;
  }>) => db.update(alertRules).set(data).where(eq(alertRules.id, id)),

  delete: (id: string) => db.delete(alertRules).where(eq(alertRules.id, id)),

  findNotificationsByProjectId: (projectId: string) =>
    db
      .select()
      .from(notifications)
      .where(eq(notifications.projectId, projectId))
      .orderBy(desc(notifications.createdAt))
      .limit(100),
};

