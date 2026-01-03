import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { projectSettings } from "../db/schema";

export const ProjectSettingsRepository = {
  findByProjectId: (projectId: string) =>
    db
      .select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .then(rows => rows[0]),

  create: (data: {
    id: string;
    projectId: string;
    timezone: string;
    retentionDays: number;
    autoResolve: boolean;
    autoResolveDays: number;
    eventsEnabled?: boolean;
    updatedAt: Date;
  }) => db.insert(projectSettings).values(data).returning().then(rows => rows[0]),

  update: (projectId: string, data: Partial<{
    timezone: string;
    retentionDays: number;
    autoResolve: boolean;
    autoResolveDays: number;
    eventsEnabled: boolean;
    updatedAt: Date;
  }>) => db.update(projectSettings).set(data).where(eq(projectSettings.projectId, projectId)),
};

