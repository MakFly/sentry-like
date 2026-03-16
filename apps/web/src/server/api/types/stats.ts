export type Stats = {
  totalGroups: number;
  totalEvents: number;
  avgEventsPerGroup: number;
};

export type DashboardStats = {
  totalGroups: number;
  totalEvents: number;
  avgEventsPerGroup: number;
  todayEvents: number;
  newIssues24h: number;
  avgResponse: string;
};

export type TimelineRange = "24h" | "7d" | "30d";

export type TimelinePoint = {
  date: string;
  events: number;
  groups: number;
};

export type EnvBreakdown = {
  env: string;
  count: number;
};

export type SeverityBreakdown = {
  level: string;
  count: number;
};

