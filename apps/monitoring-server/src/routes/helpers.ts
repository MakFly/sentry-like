import type { Handler } from "hono";
import type { AuthContext } from "../types/context";

/**
 * Helper to cast AuthContext handlers to Hono Handler type
 * This is needed because TypeScript strict mode doesn't recognize
 * that the auth middleware extends the context type
 */
export const asHandler = <T extends AuthContext>(
  handler: (c: T) => ReturnType<Handler>
): Handler => handler as unknown as Handler;

