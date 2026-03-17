import { fetchAPI } from './client';
import type { CronMonitor, CronCheckin, CronTimeline } from './types';

export const getMonitors = async (projectId: string): Promise<CronMonitor[]> => {
  return fetchAPI<CronMonitor[]>(`/cron/monitors?projectId=${projectId}`);
};

export const getMonitor = async (id: string): Promise<CronMonitor> => {
  return fetchAPI<CronMonitor>(`/cron/monitors/${id}`);
};

export const createMonitor = async (data: {
  projectId: string;
  name: string;
  slug: string;
  schedule?: string;
  timezone?: string;
  toleranceMinutes?: number;
}): Promise<CronMonitor> => {
  return fetchAPI<CronMonitor>("/cron/monitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateMonitor = async (
  id: string,
  updates: Partial<{
    name: string;
    slug: string;
    schedule: string;
    timezone: string;
    toleranceMinutes: number;
    status: string;
  }>
): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/cron/monitors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

export const deleteMonitor = async (id: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/cron/monitors/${id}`, {
    method: "DELETE",
  });
};

export const getCheckins = async (
  monitorId: string,
  page = 1,
  limit = 20
): Promise<{ items: CronCheckin[]; total: number; hasMore: boolean }> => {
  return fetchAPI(`/cron/monitors/${monitorId}/checkins?page=${page}&limit=${limit}`);
};

export const getTimeline = async (monitorId: string): Promise<CronTimeline[]> => {
  return fetchAPI<CronTimeline[]>(`/cron/monitors/${monitorId}/timeline`);
};
