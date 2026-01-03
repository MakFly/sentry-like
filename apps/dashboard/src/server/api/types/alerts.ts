export type AlertRuleType = "new_error" | "threshold" | "regression";
export type AlertChannel = "email" | "slack" | "webhook";

export type AlertRuleConfig = {
  email?: string;
  slackWebhook?: string;
  webhookUrl?: string;
};

export type AlertRule = {
  id: string;
  projectId: string;
  name: string;
  type: AlertRuleType;
  threshold: number | null;
  windowMinutes: number | null;
  channel: AlertChannel;
  config: AlertRuleConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Notification = {
  id: string;
  ruleId: string | null;
  projectId: string;
  fingerprint: string | null;
  channel: string;
  status: "sent" | "failed" | "pending";
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

