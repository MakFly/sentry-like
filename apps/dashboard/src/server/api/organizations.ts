import { fetchAPI } from './client';
import type { Organization, OrganizationSubscriptionCheck } from './types';

export const getAll = async (): Promise<Organization[]> => {
  return fetchAPI<Organization[]>("/organizations");
};

export const canCreate = async (): Promise<OrganizationSubscriptionCheck> => {
  return fetchAPI<OrganizationSubscriptionCheck>("/organizations/can-create");
};

export const create = async (name: string): Promise<Organization> => {
  return fetchAPI<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
};

export const deleteOrganization = async (id: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/organizations/${id}`, {
    method: "DELETE",
  });
};

