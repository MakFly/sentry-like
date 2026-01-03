import { eq, and } from "drizzle-orm";
import { db } from "../db/connection";
import { projects, organizations, organizationMembers } from "../db/schema";

export const ProjectRepository = {
  findByUserId: (userId: string) =>
    db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        name: projects.name,
        slug: projects.slug,
        environment: projects.environment,
        platform: projects.platform,
        organizationName: organizations.name,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(organizations, eq(organizations.id, projects.organizationId))
      .innerJoin(
        organizationMembers,
        and(
          eq(organizationMembers.organizationId, organizations.id),
          eq(organizationMembers.userId, userId)
        )
      )
      ,

  findById: (id: string) =>
    db.select().from(projects).where(eq(projects.id, id)).then(rows => rows[0]),

  findByIdWithOrg: (id: string) =>
    db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        name: projects.name,
        slug: projects.slug,
        environment: projects.environment,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.id, id))
      .then(rows => rows[0]),

  create: (data: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    environment?: string | null;
    platform?: string | null;
    createdAt: Date;
  }) => db.insert(projects).values(data).returning().then(rows => rows[0]),

  update: (id: string, data: Partial<{ name: string; slug: string }>) =>
    db.update(projects).set(data).where(eq(projects.id, id)),

  delete: (id: string) => db.delete(projects).where(eq(projects.id, id)),

  verifyUserAccess: (projectId: string, userId: string) =>
    db
      .select()
      .from(organizationMembers)
      .innerJoin(projects, eq(projects.organizationId, organizationMembers.organizationId))
      .where(
        and(eq(projects.id, projectId), eq(organizationMembers.userId, userId))
      )
      .then(rows => rows[0]),
};

