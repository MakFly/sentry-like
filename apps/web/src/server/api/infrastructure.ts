import { fetchAPI } from './client';
import type { InfraHost, InfraMetricsSnapshot, InfraMetricsHistory, InfraDateRange } from './types';

export const getHosts = async (projectId: string): Promise<InfraHost[]> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  return fetchAPI<InfraHost[]>(`/infrastructure/hosts?${params.toString()}`);
};

export const getLatest = async (projectId: string): Promise<InfraMetricsSnapshot[]> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  return fetchAPI<InfraMetricsSnapshot[]>(`/infrastructure/latest?${params.toString()}`);
};

export const getHistory = async (
  projectId: string,
  hostId: string,
  dateRange: InfraDateRange
): Promise<InfraMetricsHistory[]> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  params.set("hostId", hostId);
  params.set("dateRange", dateRange);
  return fetchAPI<InfraMetricsHistory[]>(`/infrastructure/history?${params.toString()}`);
};
