"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { ErrorGroup } from "@/server/api";

interface AttentionQueueProps {
  errors: ErrorGroup[];
  orgSlug: string;
  projectSlug: string;
  className?: string;
}

const severityConfig = {
  fatal: {
    dot: "bg-red-500",
    glow: "shadow-red-500/50",
  },
  error: {
    dot: "bg-red-400",
    glow: "shadow-red-400/40",
  },
  warning: {
    dot: "bg-amber-400",
    glow: "shadow-amber-400/40",
  },
  info: {
    dot: "bg-blue-400",
    glow: "shadow-blue-400/40",
  },
  debug: {
    dot: "bg-purple-400",
    glow: "shadow-purple-400/40",
  },
};

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function AttentionQueue({
  errors,
  orgSlug,
  projectSlug,
  className,
}: AttentionQueueProps) {
  if (errors.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashboard-border bg-dashboard-surface/30 p-8 text-center",
          className
        )}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-healthy/10">
          <svg
            className="h-6 w-6 text-status-healthy"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">All clear</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No errors requiring attention
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-surface/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-warning" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Requires Attention
          </span>
          <span className="rounded-full bg-status-warning/20 px-2 py-0.5 font-mono text-xs font-medium text-status-warning">
            {errors.length}
          </span>
        </div>
        <Link
          href={`/dashboard/${orgSlug}/${projectSlug}/issues`}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      {/* Error rows */}
      <div className="divide-y divide-dashboard-border">
        {errors.slice(0, 10).map((error) => {
          const severity = (error.level || "error") as keyof typeof severityConfig;
          const config = severityConfig[severity] || severityConfig.error;

          return (
            <Link
              key={error.fingerprint}
              href={`/dashboard/${orgSlug}/${projectSlug}/issues/${error.fingerprint}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-dashboard-surface/70"
            >
              {/* Severity dot */}
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full shadow-sm",
                  config.dot,
                  config.glow
                )}
              />

              {/* Error message */}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-foreground" title={error.message}>
                  {error.message.length > 100 ? `${error.message.slice(0, 100).trim()}...` : error.message}
                </p>
              </div>

              {/* Env badge */}
              <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-muted-foreground">
                {(error as { environment?: string }).environment || "prod"}
              </span>

              {/* Count */}
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                ×{error.count?.toLocaleString() || 1}
              </span>

              {/* Time */}
              <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                {formatTimeAgo(error.lastSeen)}
              </span>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
