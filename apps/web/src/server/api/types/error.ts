import type { Pagination } from './common';

export type ErrorLevel = "fatal" | "error" | "warning" | "info" | "debug";
export type IssueStatus = "open" | "resolved" | "ignored" | "snoozed";

export type ErrorGroup = {
  fingerprint: string;
  projectId: string | null;
  message: string;
  file: string;
  line: number;
  statusCode: number | null;
  level: ErrorLevel;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  status: IssueStatus;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  assignedTo: string | null;
  assignedAt: Date | null;
  hasReplay?: boolean;
  latestReplaySessionId?: string | null;
  latestReplayEventId?: string | null;
  latestReplayCreatedAt?: Date | null;
};

export type ErrorEvent = {
  id: string;
  fingerprint: string;
  projectId: string | null;
  stack: string;
  url: string | null;
  env: string;
  statusCode: number | null;
  level: ErrorLevel;
  breadcrumbs: string | null;
  sessionId: string | null;
  release: string | null;
  createdAt: Date;
};

export type ReleaseDistribution = {
  releases: Array<{
    version: string;
    count: number;
    percentage: number;
  }>;
  firstSeenIn: string | null;
};

export type EventsResponse = {
  events: ErrorEvent[];
  pagination: Pagination;
};

export type GroupsFilter = {
  env?: string;
  dateRange?: "24h" | "7d" | "30d" | "90d" | "all";
  projectId?: string;
  search?: string;
  status?: "open" | "resolved" | "ignored" | "snoozed";
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  sort?: "lastSeen" | "firstSeen" | "count";
  page?: number;
  limit?: number;
};

