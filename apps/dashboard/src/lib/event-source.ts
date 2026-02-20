export type EventSourceType = "http" | "cli" | "messenger" | "deprecation";

export interface EventSourceInfo {
  type: EventSourceType;
  label: string;
  icon: "Globe" | "Terminal" | "MessageSquare" | "AlertTriangle";
  color: string;
}

const SOURCE_MAP: Record<string, EventSourceInfo> = {
  "cli://": { type: "cli", label: "CLI", icon: "Terminal", color: "text-blue-400" },
  "messenger://": { type: "messenger", label: "Queue", icon: "MessageSquare", color: "text-purple-400" },
  "deprecation://": { type: "deprecation", label: "Deprecation", icon: "AlertTriangle", color: "text-amber-400" },
};

const HTTP_DEFAULT: EventSourceInfo = {
  type: "http",
  label: "HTTP",
  icon: "Globe",
  color: "text-emerald-400",
};

export function detectEventSource(url: string | null | undefined): EventSourceInfo {
  if (!url) return HTTP_DEFAULT;

  for (const [prefix, info] of Object.entries(SOURCE_MAP)) {
    if (url.startsWith(prefix)) return info;
  }

  return HTTP_DEFAULT;
}
