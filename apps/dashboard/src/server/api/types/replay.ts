import type { Pagination } from './common';
import type { ErrorLevel } from './error';

export type ReplaySession = {
  id: string;
  projectId: string;
  userId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  url: string;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  createdAt: Date;
};

export type ReplayEvent = {
  type: number;
  data: unknown;
  timestamp: number;
};

export type ReplaySessionsResponse = {
  sessions: ReplaySession[];
  pagination: Pagination;
};

export type ReplayEventsResponse = {
  events: ReplayEvent[];
  metadata: {
    sessionId: string;
    startedAt: Date;
    endedAt: Date | null;
    duration: number | null;
    url: string | null;
    userAgent: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
  };
};

export type DeviceType = "desktop" | "mobile" | "tablet";

export type ReplaySessionWithErrors = ReplaySession & {
  errorCount: number;
  maxSeverity: ErrorLevel | null;
  errorFingerprints: string[];
};

export type ReplaySessionsFilters = {
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  durationMin?: number;
  durationMax?: number;
  dateFrom?: string;
  dateTo?: string;
  errorCountMin?: number;
  severity?: ErrorLevel;
};

export type DeviceStats = {
  desktop: number;
  mobile: number;
  tablet: number;
  totalErrors: number;
};

export type ReplaySessionsWithErrorsResponse = {
  sessions: ReplaySessionWithErrors[];
  pagination: Pagination;
  stats: DeviceStats;
};

