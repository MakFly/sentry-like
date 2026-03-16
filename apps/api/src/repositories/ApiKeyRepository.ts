import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { apiKeys } from "../db/schema";

export const ApiKeyRepository = {
  findByProjectId: (projectId: string) =>
    db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        key: apiKeys.key,
        keyPrefix: apiKeys.keyPrefix,
        keyLast4: apiKeys.keyLast4,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId))
      ,

  findById: (id: string) =>
    db.select().from(apiKeys).where(eq(apiKeys.id, id)).then(rows => rows[0]),

  create: (data: {
    id: string;
    projectId: string;
    key: string;
    keyPrefix?: string | null;
    keyLast4?: string | null;
    name: string;
    createdAt: Date;
  }) => db.insert(apiKeys).values(data).returning().then(rows => rows[0]),

  delete: (id: string) => db.delete(apiKeys).where(eq(apiKeys.id, id)),
};
