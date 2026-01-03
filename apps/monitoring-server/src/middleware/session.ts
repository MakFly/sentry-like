import type { MiddlewareHandler } from "hono";
import { auth } from "../auth";

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  let user = null;

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      user = session.user;
    }
  } catch {
    // Invalid or no session - continue with null user
  }

  c.set("session", { user });
  await next();
};

