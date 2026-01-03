import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { ProjectService } from "../../services/ProjectService";
import logger from "../../logger";

export const getAll = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projects = await ProjectService.getAll(userId);
  return c.json(projects);
};

export const canCreate = async (c: AuthContext) => {
  const userId = c.get("userId");
  const result = await ProjectService.canCreate(userId);
  return c.json(result);
};

export const create = async (c: AuthContext) => {
  const userId = c.get("userId");

  const schema = z.object({
    name: z.string().min(1).max(100),
    organizationId: z.string().uuid(),
    environment: z.enum(["production", "staging", "development"]).optional().default("production"),
    platform: z.enum(["symfony", "laravel", "vuejs", "react", "nextjs", "nuxtjs", "nodejs", "hono", "fastify"]),
  });

  let input;
  try {
    input = schema.parse(await c.req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    return c.json({ error: "Invalid input" }, 400);
  }

  try {
    const project = await ProjectService.create(userId, input);
    return c.json(project);
  } catch (error: any) {
    logger.error("Project creation failed", { userId, input, error: error.message, stack: error.stack });
    if (error.message.includes("Subscription limit")) {
      return c.json(
        {
          error: "Subscription limit reached",
          reason: error.message.split(": ")[1],
          upgrade: true,
        },
        403
      );
    }
    if (error.message === "Not a member of this organization") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message || "Failed to create project" }, 500);
  }
};

export const update = async (c: AuthContext) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
  });

  let input;
  try {
    input = schema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid input" }, 400);
  }

  try {
    const project = await ProjectService.update(userId, id, input);
    return c.json(project);
  } catch (error: any) {
    if (error.message === "Project not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    if (error.message === "No updates provided") {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: error.message || "Failed to update project" }, 500);
  }
};

export const remove = async (c: AuthContext) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  try {
    const result = await ProjectService.delete(userId, id);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Project not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message || "Failed to delete project" }, 500);
  }
};

