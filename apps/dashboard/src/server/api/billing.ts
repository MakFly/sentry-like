import { fetchAPI } from './client';
import type { BillingSummary, PaidPlanType } from './types';

export const getSummary = async (projectId?: string): Promise<BillingSummary> => {
  const params = projectId ? `?projectId=${projectId}` : "";
  return fetchAPI<BillingSummary>(`/billing/summary${params}`);
};

export const createCheckout = async (plan: PaidPlanType = "pro"): Promise<{ url: string | null }> => {
  return fetchAPI<{ url: string | null }>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
};

export const createPortal = async (): Promise<{ url: string | null }> => {
  return fetchAPI<{ url: string | null }>("/billing/portal", {
    method: "POST",
  });
};

