import { fetchAPI } from './client';
import type { AlertRule, AlertRuleType, AlertChannel, AlertRuleConfig, Notification } from './types';

export const getRules = async (projectId: string): Promise<AlertRule[]> => {
  return fetchAPI<AlertRule[]>(`/alerts?projectId=${projectId}`);
};

export const createRule = async (data: {
  projectId: string;
  name: string;
  type: AlertRuleType;
  threshold?: number;
  windowMinutes?: number;
  channel: AlertChannel;
  config: AlertRuleConfig;
}): Promise<AlertRule> => {
  return fetchAPI<AlertRule>("/alerts", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateRule = async (
  id: string,
  updates: Partial<{
    name: string;
    type: AlertRuleType;
    threshold: number;
    windowMinutes: number;
    channel: AlertChannel;
    config: AlertRuleConfig;
    enabled: boolean;
  }>
): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

export const deleteRule = async (id: string): Promise<{ success: boolean }> => {
  return fetchAPI<{ success: boolean }>(`/alerts/${id}`, {
    method: "DELETE",
  });
};

export const getNotifications = async (projectId: string): Promise<Notification[]> => {
  return fetchAPI<Notification[]>(`/alerts/notifications?projectId=${projectId}`);
};

