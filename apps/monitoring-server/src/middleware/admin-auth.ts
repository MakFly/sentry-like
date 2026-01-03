import type { MiddlewareHandler } from "hono";

const ADMIN_KEY = process.env.ADMIN_API_KEY;

export const adminAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    if (!ADMIN_KEY) {
      return c.json({ error: "Admin API not configured" }, 503);
    }

    const authHeader = c.req.header("Authorization");
    const providedKey = authHeader?.replace("Bearer ", "");

    if (providedKey !== ADMIN_KEY) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  };
};

