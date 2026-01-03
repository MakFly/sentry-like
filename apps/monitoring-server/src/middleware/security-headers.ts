/**
 * Security Headers Middleware
 * @description Adds security headers to all responses (CSP, HSTS, etc.)
 */
import type { Context, Next } from "hono";

/**
 * Security headers configuration
 */
interface SecurityHeadersConfig {
  /** Enable Content-Security-Policy */
  enableCSP: boolean;
  /** Enable HTTP Strict Transport Security */
  enableHSTS: boolean;
  /** Additional allowed connect-src domains */
  allowedConnectSrc: string[];
  /** Additional allowed frame-src domains */
  allowedFrameSrc: string[];
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableCSP: true,
  enableHSTS: true,
  allowedConnectSrc: ["https://api.stripe.com"],
  allowedFrameSrc: ["https://js.stripe.com"],
};

/**
 * Security headers middleware
 */
export function securityHeaders(config: Partial<SecurityHeadersConfig> = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const isProduction = process.env.NODE_ENV === "production";

  return async (c: Context, next: Next) => {
    // Prevent MIME-sniffing
    c.header("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    c.header("X-Frame-Options", "DENY");

    // XSS Protection (legacy but still useful)
    c.header("X-XSS-Protection", "1; mode=block");

    // Referrer Policy
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");

    // Disable sensitive browser APIs
    c.header(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
    );

    // HSTS - only in production or when behind HTTPS proxy
    if (
      options.enableHSTS &&
      (isProduction || c.req.header("X-Forwarded-Proto") === "https")
    ) {
      c.header(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    // Content Security Policy
    if (options.enableCSP) {
      const connectSrc = ["'self'", ...options.allowedConnectSrc].join(" ");
      const frameSrc = ["'self'", ...options.allowedFrameSrc].join(" ");

      // More permissive in development for HMR
      const scriptSrc = isProduction ? "'self'" : "'self' 'unsafe-eval'";
      const styleSrc = "'self' 'unsafe-inline'"; // Required for many UI libraries

      const csp = [
        `default-src 'self'`,
        `script-src ${scriptSrc}`,
        `style-src ${styleSrc}`,
        `img-src 'self' https: data:`,
        `font-src 'self' data:`,
        `connect-src ${connectSrc}`,
        `frame-src ${frameSrc}`,
        `frame-ancestors 'none'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
      ].join("; ");

      c.header("Content-Security-Policy", csp);
    }

    // Cross-Origin policies
    c.header("Cross-Origin-Opener-Policy", "same-origin");
    c.header("Cross-Origin-Resource-Policy", "same-origin");

    await next();
  };
}

/**
 * Default security headers middleware instance
 */
export const defaultSecurityHeaders = securityHeaders();
