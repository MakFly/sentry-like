import type { AuthContext, ApiKeyContext } from "../../types/context";
import type { Context } from "hono";
import { z } from "zod";
import { ReleaseService } from "../../services/ReleaseService";
import logger from "../../logger";

export const create = async (c: Context) => {
  const apiKeyHeader = c.req.header("X-API-Key");
  const userId = (c as any).get("session")?.user?.id;

  const schema = z.object({
    projectId: z.string().optional(),
    version: z.string().min(1),
    environment: z.string().default("production"),
    url: z.string().url().optional(),
    commitSha: z.string().optional(),
    commitMessage: z.string().optional(),
    commitAuthor: z.string().optional(),
    deployedBy: z.string().optional(),
  });

  try {
    const input = schema.parse(await c.req.json());
    const release = await ReleaseService.create(input, apiKeyHeader || undefined);
    return c.json(release);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    if (error.message === "Invalid API key") {
      return c.json({ error: error.message }, 401);
    }
    if (error.message === "projectId is required") {
      return c.json({ error: error.message }, 400);
    }
    logger.error("Failed to create release", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const list = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");
  const limit = parseInt(c.req.query("limit") || "20", 10);

  if (!projectId) {
    return c.json({ error: "projectId query parameter required" }, 400);
  }

  try {
    const releases = await ReleaseService.list(projectId as string, userId, limit);
    return c.json(releases);
  } catch (error: any) {
    if (error.message === "Project not found" || error.message === "Access denied") {
      return c.json({ error: error.message }, 403);
    }
    logger.error("Failed to list releases", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const findById = async (c: AuthContext) => {
  const userId = c.get("userId");
  const releaseId = c.req.param("id");

  try {
    const release = await ReleaseService.findById(releaseId, userId);
    return c.json(release);
  } catch (error: any) {
    if (error.message === "Release not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Access denied") {
      return c.json({ error: error.message }, 403);
    }
    logger.error("Failed to get release", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const remove = async (c: AuthContext) => {
  const userId = c.get("userId");
  const releaseId = c.req.param("id");

  try {
    const result = await ReleaseService.delete(releaseId, userId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Release not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Access denied") {
      return c.json({ error: error.message }, 403);
    }
    logger.error("Failed to delete release", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

