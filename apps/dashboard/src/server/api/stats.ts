import { fetchAPI } from './client';
import type { Stats, DashboardStats, TimelinePoint, EnvBreakdown, TimelineRange } from './types';

export const getGlobal = async (projectId?: string): Promise<Stats> => {
  const params = projectId ? `?projectId=${projectId}` : "";
  return fetchAPI<Stats>(`/stats${params}`);
};

export const getDashboardStats = async (projectId?: string): Promise<DashboardStats> => {
  const params = projectId ? `?projectId=${projectId}` : "";
  return fetchAPI<DashboardStats>(`/stats/dashboard${params}`);
};

export const getTimeline = async (range: TimelineRange = "30d", projectId?: string): Promise<TimelinePoint[]> => {
  const params = new URLSearchParams();
  params.set("range", range);
  if (projectId) params.set("projectId", projectId);
  return fetchAPI<TimelinePoint[]>(`/stats/timeline?${params.toString()}`);
};

export const getEnvBreakdown = async (projectId?: string): Promise<EnvBreakdown[]> => {
  const params = projectId ? `?projectId=${projectId}` : "";
  return fetchAPI<EnvBreakdown[]>(`/stats/env-breakdown${params}`);
};

