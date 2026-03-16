import { fetchAPI } from './client';
import type { ApiKey } from './types';

export const getAll = async (projectId: string): Promise<ApiKey[]> => {
  return fetchAPI<ApiKey[]>(`/api-keys?projectId=${projectId}`);
};

export const create = async (projectId: string, name: string): Promise<ApiKey> => {
  return fetchAPI<ApiKey>("/api-keys", {
    method: "POST",
    body: JSON.stringify({ projectId, name }),
  });
};

export const deleteApiKey = async (id: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/api-keys/${id}`, {
    method: "DELETE",
  });
};

