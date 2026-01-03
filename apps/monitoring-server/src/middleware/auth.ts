import type { MiddlewareHandler } from "hono";

export const auth = (): MiddlewareHandler => {
  return async (c, next) => {
    const session = (c as any).get("session");
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", session.user.id);
    c.set("user", session.user);
    await next();
  };
};

