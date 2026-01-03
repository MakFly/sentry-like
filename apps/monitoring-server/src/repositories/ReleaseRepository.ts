import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/connection";
import { releases } from "../db/schema";

export const ReleaseRepository = {
  findByProjectId: (projectId: string, limit: number = 20) =>
    db
      .select()
      .from(releases)
      .where(eq(releases.projectId, projectId))
      .orderBy(desc(releases.deployedAt))
      .limit(limit)
      ,

  findById: (id: string) =>
    db.select().from(releases).where(eq(releases.id, id)).then(rows => rows[0]),

  findByProjectAndVersion: (projectId: string, version: string) =>
    db
      .select({ id: releases.id })
      .from(releases)
      .where(and(eq(releases.projectId, projectId), eq(releases.version, version)))
      .then(rows => rows[0]),

  create: (data: {
    id: string;
    projectId: string;
    version: string;
    environment: string;
    url?: string | null;
    commitSha?: string | null;
    commitMessage?: string | null;
    commitAuthor?: string | null;
    deployedBy?: string | null;
    deployedAt: Date;
    createdAt: Date;
  }) => db.insert(releases).values(data).returning().then(rows => rows[0]),

  delete: (id: string) => db.delete(releases).where(eq(releases.id, id)),
};

