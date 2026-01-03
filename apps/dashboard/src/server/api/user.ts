import { fetchAPI } from './client';
import type { UserProfile, UserSession } from './types';

export const getProfile = async (): Promise<UserProfile> => fetchAPI<UserProfile>("/user/profile");

export const updateProfile = async (data: { name?: string; image?: string }): Promise<UserProfile> =>
  fetchAPI<UserProfile>("/user/profile", { method: "PATCH", body: JSON.stringify(data) });

export const getSessions = async (): Promise<UserSession[]> => fetchAPI<UserSession[]>("/user/sessions");

export const revokeSession = async (sessionId: string): Promise<{ success: boolean }> =>
  fetchAPI<{ success: boolean }>(`/user/sessions/${sessionId}`, { method: "DELETE" });

export const revokeAllSessions = async (): Promise<{ success: boolean; count: number }> =>
  fetchAPI<{ success: boolean; count: number }>("/user/sessions", { method: "DELETE" });

export const canChangePassword = async (): Promise<{ hasPassword: boolean }> =>
  fetchAPI<{ hasPassword: boolean }>("/user/can-change-password");

