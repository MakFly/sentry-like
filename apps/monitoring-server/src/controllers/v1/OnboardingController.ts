import type { AuthContext } from "../../types/context";
import { z } from "zod";
import { OnboardingService } from "../../services/OnboardingService";
import logger from "../../logger";

export const getStatus = async (c: AuthContext) => {
  const userId = c.get("userId");
  const status = await OnboardingService.getStatus(userId);
  return c.json(status);
};

export const setup = async (c: AuthContext) => {
  const userId = c.get("userId");

  const schema = z.object({
    organizationName: z.string().min(1).max(100),
    projectName: z.string().min(1).max(100),
    environment: z.enum(["production", "staging", "development"]).optional().default("production"),
    platform: z.enum(["symfony", "laravel", "vuejs", "react", "nextjs", "nuxtjs", "nodejs", "hono", "fastify"]),
  });

  try {
    const input = schema.parse(await c.req.json());
    const result = await OnboardingService.setup(userId, input);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }

    const message = error.message || "Unknown error";
    logger.error("Failed to setup workspace", { error: message, userId });

    if (message === "User already has an organization") {
      return c.json({ error: message }, 400);
    }

    if (message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Organization or project name already exists" }, 409);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
};

