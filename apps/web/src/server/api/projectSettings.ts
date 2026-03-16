import { fetchAPI } from './client';
import type { ProjectSettings } from './types';

export const get = async (projectId: string): Promise<ProjectSettings> => {
  return fetchAPI<ProjectSettings>(`/project-settings/${projectId}`);
};

export const update = async (
  projectId: string,
  data: Partial<{
    timezone: string;
    retentionDays: number;
    autoResolve: boolean;
    autoResolveDays: number;
    eventsEnabled: boolean;
  }>
): Promise<ProjectSettings> => {
  return fetchAPI<ProjectSettings>(`/project-settings/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

