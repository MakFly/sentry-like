import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/connection";
import { sourcemaps } from "../db/schema";

export const SourcemapRepository = {
  findByProjectId: (projectId: string) =>
    db
      .select({
        id: sourcemaps.id,
        filename: sourcemaps.filename,
        fileHash: sourcemaps.fileHash,
        size: sourcemaps.size,
        releaseId: sourcemaps.releaseId,
        createdAt: sourcemaps.createdAt,
      })
      .from(sourcemaps)
      .where(eq(sourcemaps.projectId, projectId))
      .orderBy(desc(sourcemaps.createdAt)),

  findById: async (id: string) =>
    (await db.select().from(sourcemaps).where(eq(sourcemaps.id, id)))[0],

  findByFileAndHash: async (projectId: string, filename: string, hash: string) =>
    (await db
      .select()
      .from(sourcemaps)
      .where(
        and(
          eq(sourcemaps.projectId, projectId),
          eq(sourcemaps.filename, filename),
          eq(sourcemaps.fileHash, hash)
        )
      ))[0],

  findByFilename: async (projectId: string, filename: string) =>
    (await db
      .select()
      .from(sourcemaps)
      .where(
        and(
          eq(sourcemaps.projectId, projectId),
          eq(sourcemaps.filename, filename)
        )
      )
      .orderBy(desc(sourcemaps.createdAt)))[0],

  findByProjectAndRelease: (projectId: string, releaseId: string) =>
    db
      .select()
      .from(sourcemaps)
      .where(
        and(
          eq(sourcemaps.projectId, projectId),
          eq(sourcemaps.releaseId, releaseId)
        )
      ),

  create: async (data: {
    id: string;
    projectId: string;
    releaseId?: string | null;
    filename: string;
    storagePath: string;
    fileHash: string;
    size: number;
    createdAt: Date;
  }) => (await db.insert(sourcemaps).values(data).returning())[0],

  delete: (id: string) => db.delete(sourcemaps).where(eq(sourcemaps.id, id)),
};
