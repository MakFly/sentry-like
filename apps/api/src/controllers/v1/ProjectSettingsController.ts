import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { ProjectSettingsService } from "../../services/ProjectSettingsService";
import logger from "../../logger";

export const get = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");

  try {
    const settings = await ProjectSettingsService.get(projectId, userId);
    return c.json(settings);
  } catch (error: any) {
    if (error.message === "Project not found" || error.message === "Access denied") {
      return c.json({ error: error.message }, 403);
    }
    logger.error("Failed to get project settings", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const update = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");

  const schema = z.object({
    timezone: z.string().optional(),
    retentionDays: z.number().min(7).max(365).optional(),
    autoResolve: z.boolean().optional(),
    autoResolveDays: z.number().min(3).max(60).optional(),
    eventsEnabled: z.boolean().optional(),
  });

  let input;
  try {
    input = schema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid input" }, 400);
  }

  try {
    const settings = await ProjectSettingsService.update(projectId, userId, input);
    return c.json(settings);
  } catch (error: any) {
    if (error.message === "Project not found" || error.message === "Access denied") {
      return c.json({ error: error.message }, 403);
    }
    logger.error("Failed to update project settings", { error });
    return c.json({ error: "Internal server error" }, 500);
  }
};

