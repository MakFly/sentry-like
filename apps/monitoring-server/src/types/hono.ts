/**
 * Hono application environment types
 * @description Typed context variables set by middleware
 */

/**
 * Session user shape from BetterAuth
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Session shape injected by sessionMiddleware
 */
export interface AppSession {
  user: SessionUser | null;
}

/**
 * API key data injected by apiKeyMiddleware
 */
export interface ApiKeyData {
  id: string;
  projectId: string;
}

/**
 * Hono application environment with typed context variables
 */
export type AppEnv = {
  Variables: {
    session: AppSession;
    user: SessionUser;
    userId: string;
    apiKey: ApiKeyData;
  };
};
