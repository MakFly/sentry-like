/**
 * Dev-only routes - only available in development mode
 */
import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { adminAuth } from "../../middleware/admin-auth";
import { db } from "../../db/connection";
import { errorGroups, errorEvents, replaySessions, sessionEvents, users } from "../../db/schema";
import { OrganizationRepository } from "../../repositories/OrganizationRepository";
import { ProjectRepository } from "../../repositories/ProjectRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { ApiKeyRepository } from "../../repositories/ApiKeyRepository";
import { generateApiKey, getKeyPreviewParts, hashApiKey } from "../../services/api-keys";
import { ApiKeyService } from "../../services/ApiKeyService";
import logger from "../../logger";

const DEV_SEED_USER_EMAIL = "dev-seed@errorwatch.local";

const slugify = (input: string, fallback: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || fallback;

const router = new Hono();

// Block all routes in production
router.use("*", async (c, next) => {
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Not available in production" }, 403);
  }
  await next();
});

/**
 * List users (email, name) - admin auth required, for login page autofill in dev
 */
router.get("/users", adminAuth(), async (c) => {
  const rows = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .orderBy(users.createdAt);
  return c.json(rows);
});

/**
 * Reset error tracking tables (dev only)
 * Clears: error_groups, error_events, replay_sessions, session_events
 */
router.post("/reset-tables", auth(), async (c) => {
  try {
    logger.warn("DEV: Resetting error tracking tables");

    // Delete in correct order (foreign key constraints)
    await db.delete(sessionEvents);
    await db.delete(errorEvents);
    await db.delete(errorGroups);
    await db.delete(replaySessions);

    logger.info("DEV: Tables reset successfully");

    return c.json({
      success: true,
      message: "All error tracking tables have been reset",
      tables: ["error_groups", "error_events", "replay_sessions", "session_events"],
    });
  } catch (error) {
    logger.error("DEV: Failed to reset tables", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return c.json(
      { error: "Failed to reset tables", details: error instanceof Error ? error.message : "Unknown" },
      500
    );
  }
});

/**
 * Seed an example workspace (dev only). Idempotent on org+project slug:
 * reuses the org/project if they already exist and always issues a fresh API key.
 * Body: { name: string, orgName?: string, projectName?: string, platform?: string, environment?: string }
 */
router.post("/seed-example", async (c) => {
  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return c.json({ error: "Field 'name' is required (e.g. 'symfony', 'laravel')" }, 400);
  }

  const orgName = typeof body.orgName === "string" && body.orgName.trim()
    ? body.orgName.trim()
    : "ErrorWatch Examples";
  const projectName = typeof body.projectName === "string" && body.projectName.trim()
    ? body.projectName.trim()
    : `Example ${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const platform = typeof body.platform === "string" && body.platform.trim()
    ? body.platform.trim()
    : name;
  const environment = typeof body.environment === "string" && body.environment.trim()
    ? body.environment.trim()
    : "development";

  const orgSlug = slugify(orgName, "examples");
  const projectSlug = slugify(`${name}`, `example-${name}`);

  const now = new Date();

  try {
    // 1. Get or create the dev seed user (owner of all example workspaces)
    let devUser = await UserRepository.findByEmail(DEV_SEED_USER_EMAIL);
    if (!devUser) {
      devUser = await UserRepository.create({
        id: crypto.randomUUID(),
        name: "Dev Seed",
        email: DEV_SEED_USER_EMAIL,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Get or create org by slug (with dev user as owner).
    let org = await OrganizationRepository.findBySlug(orgSlug);
    if (!org) {
      org = await OrganizationRepository.create({
        id: crypto.randomUUID(),
        name: orgName,
        slug: orgSlug,
        createdAt: now,
      });
      await OrganizationRepository.createMembership({
        id: crypto.randomUUID(),
        organizationId: org.id,
        userId: devUser.id,
        role: "owner",
        createdAt: now,
      });
    }

    // 3. Get or create project by slug within the org.
    let project = await ProjectRepository.findByOrgAndSlug(org.id, projectSlug);
    if (!project) {
      project = await ProjectRepository.create({
        id: crypto.randomUUID(),
        organizationId: org.id,
        name: projectName,
        slug: projectSlug,
        environment,
        platform,
        createdAt: now,
      });
    }

    // 4. Always issue a fresh API key — we cannot recover hashed plaintext.
    const plaintextKey = generateApiKey("live");
    const keyHash = hashApiKey(plaintextKey);
    const { keyPrefix, keyLast4 } = getKeyPreviewParts(plaintextKey);
    const keyRecord = await ApiKeyRepository.create({
      id: crypto.randomUUID(),
      projectId: project.id,
      key: keyHash,
      keyPrefix,
      keyLast4,
      name: `Example ${name} (auto-seeded)`,
      createdAt: now,
    });

    logger.info("DEV: Example workspace seeded", {
      name,
      orgSlug: org.slug,
      projectSlug: project.slug,
      apiKeyId: keyRecord.id,
    });

    return c.json({
      organization: { id: org.id, name: org.name, slug: org.slug },
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        platform: project.platform,
        environment: project.environment,
      },
      apiKey: { id: keyRecord.id, key: plaintextKey, name: keyRecord.name },
    });
  } catch (error) {
    logger.error("DEV: Failed to seed example", {
      name,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return c.json(
      { error: "Failed to seed example", details: error instanceof Error ? error.message : "Unknown" },
      500
    );
  }
});

/**
 * Resolve an API key (plaintext) to its (org slug, project slug) for dashboard linking.
 * Dev-only — used by scripts/example-bootstrap.sh when the user pins a pre-existing key.
 */
router.post("/lookup-key", async (c) => {
  let body: { key?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key) {
    return c.json({ error: "Field 'key' is required" }, 400);
  }

  const validation = await ApiKeyService.validate(key);
  if (!validation) {
    return c.json({ error: "Unknown API key" }, 404);
  }

  const project = await ProjectRepository.findByIdWithOrg(validation.projectId);
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  const org = await OrganizationRepository.findById(project.organizationId);
  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  return c.json({
    organization: { id: org.id, name: org.name, slug: org.slug },
    project: { id: project.id, name: project.name, slug: project.slug },
  });
});

export default router;
