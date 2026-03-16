import { fetchAPI } from './client';
import type { Project, Platform, SubscriptionCheck } from './types';

export const getAll = async (): Promise<Project[]> => {
  try {
    return await fetchAPI<Project[]>("/projects");
  } catch {
    return []; // Return empty array if not authenticated
  }
};

export const getCurrent = async (): Promise<Project | null> => {
  // For MVP, return null - project selection handled client-side
  return null;
};

export const setCurrent = async (_projectId: string): Promise<{ success: boolean }> => {
  // For MVP, no-op - project selection handled client-side
  return { success: true };
};

export const canCreate = async (): Promise<SubscriptionCheck> => {
  return fetchAPI<SubscriptionCheck>("/projects/can-create");
};

export const create = async (data: { name: string; organizationId: string; environment?: string; platform: Platform }): Promise<Project> => {
  return fetchAPI<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id: string, data: { name?: string }): Promise<Project> => {
  return fetchAPI<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteProject = async (id: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/projects/${id}`, {
    method: "DELETE",
  });
};

