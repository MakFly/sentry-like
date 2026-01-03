import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { ApiKeyService } from "../../services/ApiKeyService";
import logger from "../../logger";

export const list = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");

  if (!projectId) {
    return c.json({ error: "projectId query parameter is required" }, 400);
  }

  try {
    const keys = await ApiKeyService.list(projectId as string, userId);
    return c.json(keys);
  } catch (error: any) {
    const message = error.message || "Unknown error";
    logger.error("Failed to list API keys", { error: message, projectId });

    if (message === "Project not found" || message === "Access denied") {
      return c.json({ error: message }, 403);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const create = async (c: AuthContext) => {
  const userId = c.get("userId");

  const schema = z.object({
    projectId: z.string().min(1),
    name: z.string().min(1).max(100),
  });

  try {
    const input = schema.parse(await c.req.json());
    const result = await ApiKeyService.create(input.projectId, input.name, userId);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }

    const message = error.message || "Unknown error";
    logger.error("Failed to create API key", { error: message });

    if (message === "Project not found" || message === "Access denied") {
      return c.json({ error: message }, 403);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const remove = async (c: AuthContext) => {
  const userId = c.get("userId");
  const keyId = c.req.param("id");

  try {
    const result = await ApiKeyService.delete(keyId, userId);
    return c.json(result);
  } catch (error: any) {
    const message = error.message || "Unknown error";
    logger.error("Failed to delete API key", { error: message, keyId });

    if (message === "API key not found") {
      return c.json({ error: message }, 404);
    }
    if (message === "Project not found" || message === "Access denied") {
      return c.json({ error: message }, 403);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};

