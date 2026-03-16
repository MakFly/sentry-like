import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/hono";

export const auth = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const session = c.get("session");
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", session.user.id);
    c.set("user", session.user);
    await next();
  };
};

