export type ErrorEventPayload = {
  message: string;
  file: string;
  line: number;
  stack: string;
  env: string;
  url?: string;
  created_at: number;
};

export type ErrorGroup = {
  fingerprint: string;
  message: string;
  file: string;
  line: number;
  count: number;
  firstSeen: number;
  lastSeen: number;
};

export type ErrorEvent = {
  id: string;
  fingerprint: string;
  stack: string;
  url: string | null;
  env: string;
  createdAt: number;
};

export type GroupsFilter = {
  env?: string;
  dateRange?: "24h" | "7d" | "30d" | "90d" | "all";
  projectId?: string;
};

export * from "./services";
export * from "./context";
