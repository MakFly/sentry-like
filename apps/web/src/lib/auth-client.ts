import { createAuthClient } from "better-auth/react";
import { getMonitoringApiUrl } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: getMonitoringApiUrl(),
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
