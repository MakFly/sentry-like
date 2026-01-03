/**
 * Protected tRPC procedures with authentication
 * @description Middleware that ensures user is authenticated before accessing procedures
 */
import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { cookies } from "next/headers";

/**
 * Session type from BetterAuth
 */
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
}

/**
 * Context with optional session
 */
export interface ProtectedContext {
  session: Session | null;
}

/**
 * Context with required session (for protected procedures)
 */
export interface AuthenticatedContext extends ProtectedContext {
  session: Session;
  userId: string;
  user: Session["user"];
}

/**
 * Create tRPC context with session from cookies
 */
export const createProtectedContext = async (): Promise<ProtectedContext> => {
  let session: Session | null = null;

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Build cookie header for API request
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    if (cookieHeader) {
      // Fetch session from monitoring server
      const apiUrl = process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333";
      const response = await fetch(`${apiUrl}/api/auth/get-session`, {
        headers: {
          Cookie: cookieHeader,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.user?.id) {
          session = { user: data.user };
        }
      }
    }
  } catch (error) {
    // Silent fail - user not authenticated
    console.debug("[tRPC] Failed to get session:", error);
  }

  return { session };
};

/**
 * Initialize tRPC with protected context
 */
const t = initTRPC.context<ProtectedContext>().create({
  transformer: superjson,
});

/**
 * Public procedure - no authentication required
 * Use sparingly and only for truly public operations (e.g., auth.getSession)
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED if no valid session
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { session } = opts.ctx;

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required. Please log in.",
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      session,
      userId: session.user.id,
      user: session.user,
    } as AuthenticatedContext,
  });
});

/**
 * Router and middleware exports
 */
export const router = t.router;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;
