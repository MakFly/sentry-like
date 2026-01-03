import { db } from "../db/connection";
import { projects, organizationMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verify user has access to a project (is member of the organization)
 * Returns true if user is a member of the organization that owns the project
 */
export async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = (await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId)))[0];

  if (!project) return false;

  const membership = (await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, userId)
      )
    ))[0];

  return !!membership;
}

