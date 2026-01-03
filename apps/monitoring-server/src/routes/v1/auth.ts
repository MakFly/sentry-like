import { Hono } from "hono";
import { auth } from "../../auth";
import logger from "../../logger";

const router = new Hono();

// NOTE: Rate limiting is handled globally in middleware/rate-limit.ts
// - DEV: Completely disabled for development fluency
// - PROD: Uses rateLimiters.auth (20 req/15 min)

router.on(["POST", "GET"], "/*", async (c) => {
  const method = c.req.raw.method;
  const path = c.req.path;

  logger.debug(`Auth request: ${method} ${path}`);

  try {
    const response = await auth.handler(c.req.raw);

    if (!response.ok) {
      const body = await response.clone().text();
      logger.warn(`Auth request failed: ${method} ${path}`, {
        status: response.status,
        body: body.substring(0, 200),
      });
    }

    return response;
  } catch (error) {
    logger.error(`Auth error: ${method} ${path}`, { error });
    throw error;
  }
});

export default router;
