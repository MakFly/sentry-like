import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333",
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
