import { fetchAPI } from './client';
import type { Member, Invite } from './types';

export const getByOrganization = async (organizationId: string): Promise<Member[]> => {
  return fetchAPI<Member[]>(`/members/organization/${organizationId}`);
};

export const invite = async (organizationId: string, email: string, method: "token" | "direct" = "token"): Promise<Invite> => {
  return fetchAPI<Invite>("/members/invite", {
    method: "POST",
    body: JSON.stringify({ organizationId, email, method }),
  });
};

export const checkInvite = async (token: string): Promise<{
  valid: boolean;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  email?: string;
  role?: string;
  expiresAt?: Date;
  error?: string;
}> => {
  return fetchAPI(`/members/check/${token}`);
};

export const acceptInvite = async (token: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>("/members/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};

export const remove = async (memberId: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/members/${memberId}`, {
    method: "DELETE",
  });
};

