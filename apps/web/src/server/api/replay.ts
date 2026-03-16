import { fetchAPI } from './client';
import type { ReplaySession, ReplaySessionsResponse, ReplayEventsResponse, ReplaySessionsWithErrorsResponse, ReplaySessionsFilters } from './types';

export const getSessions = async (
  projectId: string,
  page: number = 1,
  limit: number = 20
): Promise<ReplaySessionsResponse> => {
  return fetchAPI<ReplaySessionsResponse>(
    `/replay/sessions?projectId=${projectId}&page=${page}&limit=${limit}`
  );
};

export const getSessionsWithErrors = async (
  projectId: string,
  filters?: ReplaySessionsFilters,
  page: number = 1,
  limit: number = 20
): Promise<ReplaySessionsWithErrorsResponse> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters?.deviceType) params.set("deviceType", filters.deviceType);
  if (filters?.browser) params.set("browser", filters.browser);
  if (filters?.os) params.set("os", filters.os);
  if (filters?.durationMin !== undefined) params.set("durationMin", String(filters.durationMin));
  if (filters?.durationMax !== undefined) params.set("durationMax", String(filters.durationMax));
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.errorCountMin !== undefined) params.set("errorCountMin", String(filters.errorCountMin));
  if (filters?.severity) params.set("severity", filters.severity);

  return fetchAPI<ReplaySessionsWithErrorsResponse>(
    `/replay/sessions-with-errors?${params.toString()}`
  );
};

export const getSession = async (sessionId: string): Promise<ReplaySession> => {
  return fetchAPI<ReplaySession>(`/replay/session/${sessionId}`);
};

export const getSessionEvents = async (sessionId: string, errorEventId?: string, errorTime?: string): Promise<ReplayEventsResponse> => {
  const params = new URLSearchParams();
  if (errorEventId) params.set("errorEventId", errorEventId);
  if (errorTime) params.set("errorTime", errorTime);

  const query = params.toString();
  const url = `/replay/session/${sessionId}/events${query ? `?${query}` : ""}`;
  return fetchAPI<ReplayEventsResponse>(url);
};

