export type CronMonitorStatus = "active" | "paused" | "disabled";
export type CronCheckinStatus = "ok" | "in_progress" | "error" | "missed";

export type CronMonitor = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  schedule: string | null;
  timezone: string;
  toleranceMinutes: number;
  status: CronMonitorStatus;
  lastCheckinAt: string | null;
  lastCheckinStatus: CronCheckinStatus | null;
  nextExpectedAt: string | null;
  env: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CronCheckin = {
  id: string;
  monitorId: string;
  status: CronCheckinStatus;
  duration: number | null;
  env: string | null;
  checkinId: string | null;
  payload: Record<string, unknown> | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type CronTimeline = {
  date: string;
  ok: number;
  error: number;
  missed: number;
  in_progress: number;
};
