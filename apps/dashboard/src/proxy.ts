import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333";
const API_VERSION = "v1";
const FAIL_OPEN = process.env.AUTH_FAIL_OPEN === "true" || process.env.NODE_ENV !== "production";

/**
 * Invalidates session cookie and redirects to login
 */
function invalidateSessionAndRedirect(
  request: NextRequest,
  redirectPath?: string,
  errorCode?: string
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  if (redirectPath) {
    loginUrl.searchParams.set("redirect", redirectPath);
  }
  if (errorCode) {
    loginUrl.searchParams.set("error", errorCode);
  }
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = ["/", "/login", "/signup", "/invite"];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );

  const isApiRoute = pathname.startsWith("/api");
  const isStaticRoute = pathname.startsWith("/_next");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  // Get session cookie (support secure prefix in production)
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie =
    !!sessionCookie ||
    cookieHeader.includes("better-auth.session_token=") ||
    cookieHeader.includes("__Secure-better-auth.session_token=");

  // Redirect authenticated users away from auth pages
  const authRoutes = ["/login", "/signup"];
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  let sessionValidationFailed = false;

  if (hasSessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public routes, API routes, and static files
  if (isPublicRoute || isApiRoute || isStaticRoute) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session with API (cookie exists but may be expired/invalid)
  try {
    const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!sessionRes.ok) {
      return invalidateSessionAndRedirect(request, pathname);
    }

    const sessionData = await sessionRes.json();
    if (!sessionData?.user?.id) {
      return invalidateSessionAndRedirect(request, pathname);
    }
  } catch (error) {
    // Network error → optionally fail open to avoid blocking users
    console.error("[Middleware] Failed to validate session:", error);
    sessionValidationFailed = true;
    if (!FAIL_OPEN) {
      return invalidateSessionAndRedirect(request, pathname, "auth_unavailable");
    }
  }

  // Check if user needs onboarding (only for dashboard routes)
  if (!sessionValidationFailed && (pathname.startsWith("/dashboard") || isOnboardingRoute)) {
    try {
      const statusRes = await fetch(`${API_URL}/api/${API_VERSION}/onboarding/status`, {
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      });

      if (statusRes.ok) {
        const status = await statusRes.json();

        // Redirect to onboarding if needed (mandatory)
        if (status.needsOnboarding && !isOnboardingRoute) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }

        // Redirect to dashboard if already onboarded
        if (!status.needsOnboarding && isOnboardingRoute) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch (error) {
      // If onboarding check fails, optionally fail open
      console.error("Failed to check onboarding status:", error);
      if (!FAIL_OPEN) {
        return new NextResponse("Service unavailable", { status: 503 });
      }
    }
  }

  // Smart redirect: /dashboard → /dashboard/[first-org-slug]
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    try {
      const orgsRes = await fetch(`${API_URL}/api/${API_VERSION}/organizations`, {
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      });

      if (orgsRes.ok) {
        const organizations = await orgsRes.json();
        if (organizations && organizations.length > 0) {
          return NextResponse.redirect(new URL(`/dashboard/${organizations[0].slug}`, request.url));
        }
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }

    // Fallback: redirect to onboarding if no orgs found
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|_next/webpack).*)"],
};
