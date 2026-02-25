import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/connection";
import * as schema from "./db/schema";

// Build social providers config only for configured providers
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = process.env.USE_SECURE_COOKIES === "true" && isProduction;

const devTrustedOrigins = [
  "localhost:*",
  "127.0.0.1:*",
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:3002",
  process.env.DASHBOARD_URL || "",
].filter(Boolean);
const trustedOrigins = isProduction
  ? [process.env.DASHBOARD_URL || ""].filter(Boolean)
  : devTrustedOrigins;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3333",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  trustedOrigins,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: useSecureCookies,
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    },
  },
  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
      },
    },
  },
});
