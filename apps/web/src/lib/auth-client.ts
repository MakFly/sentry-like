import { createAuthClient } from "better-auth/react";
import { MONITORING_API_URL } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: MONITORING_API_URL,
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
