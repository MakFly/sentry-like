/**
 * tRPC base configuration
 * @see https://trpc.io/docs/server/setup
 */
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
 * Context for tRPC procedures
 */
export interface Context {
  session: Session | null;
}

/**
 * Create tRPC context with session from cookies
 */
export const createTRPCContext = async (): Promise<Context> => {
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
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Exports
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
