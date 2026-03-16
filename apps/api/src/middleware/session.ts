import type { MiddlewareHandler } from "hono";
import { auth } from "../auth";
import type { AppEnv } from "../types/hono";

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
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

