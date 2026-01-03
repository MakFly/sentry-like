import { fetchAPI } from './client';
import type { ErrorGroup, EventsResponse, IssueStatus, ReleaseDistribution, GroupsFilter } from './types';

export const getAll = async (filters?: GroupsFilter): Promise<ErrorGroup[]> => {
  const params = new URLSearchParams();
  if (filters?.env) params.set("env", filters.env);
  if (filters?.dateRange) params.set("dateRange", filters.dateRange);
  if (filters?.projectId) params.set("projectId", filters.projectId);
  const query = params.toString();
  return fetchAPI<ErrorGroup[]>(`/groups${query ? `?${query}` : ""}`);
};

export const getById = async (fingerprint: string): Promise<ErrorGroup | null> => {
  return fetchAPI<ErrorGroup | null>(`/groups/${fingerprint}`);
};

export const getEvents = async (fingerprint: string, page: number = 1, limit: number = 10): Promise<EventsResponse> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  return fetchAPI<EventsResponse>(`/groups/${fingerprint}/events?${params.toString()}`);
};

export const getTimeline = async (fingerprint: string): Promise<Array<{ date: string; count: number }>> => {
  return fetchAPI<Array<{ date: string; count: number }>>(`/groups/${fingerprint}/timeline`);
};

export const updateStatus = async (fingerprint: string, status: IssueStatus): Promise<ErrorGroup> => {
  return fetchAPI<ErrorGroup>(`/groups/${fingerprint}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

export const updateAssignment = async (fingerprint: string, assignedTo: string | null): Promise<ErrorGroup> => {
  return fetchAPI<ErrorGroup>(`/groups/${fingerprint}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assignedTo }),
  });
};

export const getReleases = async (fingerprint: string): Promise<ReleaseDistribution> => {
  return fetchAPI<ReleaseDistribution>(`/groups/${fingerprint}/releases`);
};

