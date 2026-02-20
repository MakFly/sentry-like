export type AlertChannel = "email" | "slack" | "webhook";
export type AlertRuleConfig = {
  email?: string;
  slackWebhook?: string;
  webhookUrl?: string;
};

export type AlertRuleType = "new_error" | "threshold" | "regression";

export type CreateAlertRuleInput = {
  projectId: string;
  name: string;
  type: AlertRuleType;
  threshold?: number;
  windowMinutes?: number;
  channel: AlertChannel;
  config: AlertRuleConfig;
};

export type DashboardStats = {
  totalGroups: number;
  totalEvents: number;
  avgEventsPerGroup: number;
  todayEvents: number;
  newIssues24h: number;
  avgResponse: string;
};

export type EnvBreakdown = {
  env: string;
  count: number;
};

export type ErrorAlertEmailData = {
  to: string;
  projectName: string;
  errorMessage: string;
  errorFile: string;
  errorLine: number;
  eventCount: number;
  fingerprint: string;
  environment?: string;
  dashboardUrl: string;
};

export type RegressionAlertEmailData = {
  to: string;
  projectName: string;
  errorMessage: string;
  errorFile: string;
  errorLine: number;
  eventCount: number;
  fingerprint: string;
  environment?: string;
  resolvedAt?: string;
  dashboardUrl: string;
};

export type InvitationEmailData = {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  expiresIn: string;
};

export type IssueStatus = "open" | "resolved" | "ignored" | "snoozed";

export type PlanType = "free" | "pro" | "team" | "enterprise";

export type QuotaStatus = {
  used: number;
  limit: number;
  percentage: number;
  exceeded: boolean;
  remaining: number;
};

export type RetentionStats = {
  eventsDeleted: number;
  groupsDeleted: number;
  notificationsDeleted: number;
};

export type Stats = {
  totalGroups: number;
  totalEvents: number;
  avgEventsPerGroup: number;
};

export type SubscriptionCheck = {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxProjects: number;
  isBypassed: boolean;
  plan: PlanType;
};

export type OrganizationSubscriptionCheck = {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxOrganizations: number;
  isBypassed: boolean;
  plan: PlanType;
};

export type ThresholdAlertEmailData = {
  to: string;
  projectName: string;
  eventCount: number;
  threshold: number;
  windowMinutes: number;
  dashboardUrl: string;
};

export type TimelinePoint = {
  date: string;
  events: number;
  groups: number;
};

export type TimelineRange = "24h" | "7d" | "30d";
