"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Navigation,
  Terminal,
  Globe,
  AlertCircle,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type BreadcrumbCategory = "ui" | "navigation" | "console" | "http" | "user" | "error";

interface Breadcrumb {
  timestamp: number;
  category: BreadcrumbCategory;
  type?: string;
  message?: string;
  data?: Record<string, unknown>;
}

interface EventTimelineProps {
  breadcrumbs: string | null;
  errorTimestamp: Date | string;
  errorMessage: string;
  sessionId?: string | null;
  errorEventId?: string;
  orgSlug: string;
  projectSlug: string;
  className?: string;
}

const categoryConfig: Record<BreadcrumbCategory, {
  icon: typeof MousePointer2;
  color: string;
  bg: string;
  label: string;
}> = {
  ui: {
    icon: MousePointer2,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "ui.click",
  },
  navigation: {
    icon: Navigation,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "navigation",
  },
  console: {
    icon: Terminal,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "console",
  },
  http: {
    icon: Globe,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    label: "http",
  },
  user: {
    icon: MousePointer2,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    label: "user",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "error",
  },
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function TimelineItem({
  breadcrumb,
  isLast,
  isError = false,
}: {
  breadcrumb: Breadcrumb;
  isLast: boolean;
  isError?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = isError ? categoryConfig.error : (categoryConfig[breadcrumb.category] || categoryConfig.user);
  const Icon = config.icon;
  const hasData = breadcrumb.data && Object.keys(breadcrumb.data).length > 0;

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-issues-border" />
      )}

      {/* Dot */}
      <div className={cn(
        "relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border",
        isError ? "bg-signal-error/20 border-signal-error/50" : config.bg,
        isError && "ring-2 ring-signal-error/30 ring-offset-2 ring-offset-issues-bg"
      )}>
        {isError ? (
          <span className="text-[10px] font-bold text-signal-error">!</span>
        ) : (
          <Icon className={cn("h-3 w-3", config.color)} />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 pb-4 min-w-0",
        isError && "pb-0"
      )}>
        <div
          className={cn(
            "rounded-lg border transition-colors",
            isError
              ? "bg-signal-error/5 border-signal-error/20"
              : "bg-issues-surface/50 border-issues-border hover:border-issues-border/80",
            hasData && "cursor-pointer"
          )}
          onClick={() => hasData && setExpanded(!expanded)}
        >
          <div className="px-3 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Time */}
              <span className={cn(
                "font-mono text-xs tabular-nums shrink-0",
                isError ? "text-signal-error" : "text-muted-foreground"
              )}>
                {formatTime(breadcrumb.timestamp)}
              </span>

              {/* Message */}
              <span className={cn(
                "text-sm truncate",
                isError ? "text-signal-error font-medium" : "text-foreground"
              )} title={breadcrumb.message || breadcrumb.type || config.label}>
                {(breadcrumb.message || breadcrumb.type || config.label).length > 100 
                  ? `${(breadcrumb.message || breadcrumb.type || config.label).slice(0, 100).trim()}...` 
                  : (breadcrumb.message || breadcrumb.type || config.label)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Category badge */}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
                config.bg,
                config.color
              )}>
                {config.label}
              </span>

              {/* Expand indicator */}
              {hasData && (
                expanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Expanded data */}
          {expanded && hasData && (
            <div className="px-3 pb-2 pt-1 border-t border-issues-border">
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(breadcrumb.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventTimeline({
  breadcrumbs: rawBreadcrumbs,
  errorTimestamp,
  errorMessage,
  sessionId,
  errorEventId,
  orgSlug,
  projectSlug,
  className,
}: EventTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  // Parse breadcrumbs
  let breadcrumbs: Breadcrumb[] = [];
  if (rawBreadcrumbs && rawBreadcrumbs !== "null") {
    try {
      breadcrumbs = JSON.parse(rawBreadcrumbs);
    } catch {
      // Invalid JSON
    }
  }

  // Sort by timestamp and add error event
  const errorTs = new Date(errorTimestamp).getTime();
  const sortedBreadcrumbs = [...breadcrumbs].sort((a, b) => a.timestamp - b.timestamp);

  // Limit display
  const maxItems = showAll ? sortedBreadcrumbs.length : 8;
  const displayBreadcrumbs = sortedBreadcrumbs.slice(-maxItems);
  const hiddenCount = sortedBreadcrumbs.length - displayBreadcrumbs.length;

  // Add error as final event
  const errorEvent: Breadcrumb = {
    timestamp: errorTs,
    category: "error",
    message: errorMessage,
  };

  const hasReplay = !!sessionId;

  return (
    <div className={cn(
      "rounded-xl border border-issues-border bg-issues-surface overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-issues-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Event Timeline
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-muted/10 text-[10px] font-mono text-muted-foreground">
            {breadcrumbs.length} actions
          </span>
        </div>

        {hasReplay && (
          <Link
            href={`/dashboard/${orgSlug}/${projectSlug}/replays/${sessionId}?errorTime=${new Date(errorTimestamp).toISOString()}${errorEventId ? `&errorEventId=${errorEventId}` : ""}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-xs font-medium hover:bg-violet-500/20 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Replay
          </Link>
        )}
      </div>

      {/* Timeline */}
      <div className="p-4">
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mb-4 py-2 rounded-lg border border-dashed border-issues-border text-xs text-muted-foreground hover:text-foreground hover:border-issues-border/80 transition-colors"
          >
            Show {hiddenCount} earlier events
          </button>
        )}

        {displayBreadcrumbs.length === 0 && !errorMessage ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            No breadcrumbs recorded
          </p>
        ) : (
          <>
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <TimelineItem
                key={`${breadcrumb.timestamp}-${index}`}
                breadcrumb={breadcrumb}
                isLast={false}
              />
            ))}

            {/* Error event - always last */}
            <TimelineItem
              breadcrumb={errorEvent}
              isLast={true}
              isError
            />
          </>
        )}
      </div>
    </div>
  );
}
