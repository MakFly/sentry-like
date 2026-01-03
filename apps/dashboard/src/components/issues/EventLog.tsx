"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  Globe,
  Terminal,
  Play,
} from "lucide-react";
import { BreadcrumbsTimeline } from "@/components/BreadcrumbsTimeline";

interface EventLogEvent {
  id: string;
  stack: string;
  url: string | null;
  env: string;
  statusCode: number | null;
  breadcrumbs: string | null;
  sessionId: string | null;
  createdAt: Date;
}

interface EventLogProps {
  events: EventLogEvent[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  projectSlug: string;
  isLoading?: boolean;
  className?: string;
}

const envColors: Record<string, string> = {
  prod: "bg-signal-fatal/15 text-signal-fatal border-signal-fatal/20",
  production: "bg-signal-fatal/15 text-signal-fatal border-signal-fatal/20",
  staging: "bg-signal-warning/15 text-signal-warning border-signal-warning/20",
  dev: "bg-signal-info/15 text-signal-info border-signal-info/20",
  development: "bg-signal-info/15 text-signal-info border-signal-info/20",
};

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function EventRow({
  event,
  index,
  projectSlug,
}: {
  event: EventLogEvent;
  index: number;
  projectSlug: string;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const hasBreadcrumbs = event.breadcrumbs && event.breadcrumbs !== "null";
  const hasReplay = !!event.sessionId;

  return (
    <div
      className={cn(
        "border-b border-issues-border/50 transition-colors",
        expanded && "bg-issues-surface/30"
      )}
    >
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-issues-surface/50"
      >
        {/* Expand toggle */}
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Time ago */}
        <div className="flex w-20 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{formatTimeAgo(event.createdAt)}</span>
        </div>

        {/* Environment */}
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            envColors[event.env] || "bg-muted/10 text-muted-foreground"
          )}
        >
          {event.env}
        </span>

        {/* Status code */}
        {event.statusCode && (
          <span
            className={cn(
              "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              event.statusCode >= 500
                ? "border-signal-fatal/20 bg-signal-fatal/10 text-signal-fatal"
                : event.statusCode >= 400
                ? "border-signal-error/20 bg-signal-error/10 text-signal-error"
                : "border-muted-foreground/20 bg-muted/10 text-muted-foreground"
            )}
          >
            {event.statusCode}
          </span>
        )}

        {/* URL */}
        {event.url && (
          <span className="hidden min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{event.url}</span>
          </span>
        )}

        {/* Event ID */}
        <span className="shrink-0 font-mono text-xs text-muted-foreground/60">
          #{event.id.slice(0, 8)}
        </span>

        {/* Replay link */}
        {hasReplay && (
          <Link
            href={`/dashboard/${projectSlug}/replays/${event.sessionId}?errorTime=${new Date(event.createdAt).toISOString()}&errorEventId=${event.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-1 rounded bg-pulse-primary/10 px-2 py-1 text-xs font-medium text-pulse-primary transition-colors hover:bg-pulse-primary/20"
          >
            <Play className="h-3 w-3" />
            Replay
          </Link>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-4 border-t border-issues-border/50 bg-issues-bg/30 px-4 py-4 pl-11">
          {/* Breadcrumbs */}
          {hasBreadcrumbs && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                Breadcrumbs
              </h4>
              <BreadcrumbsTimeline breadcrumbs={event.breadcrumbs} maxItems={15} />
            </div>
          )}

          {/* Stack trace preview */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              Stack Trace
            </h4>
            <pre className="scrollbar-thin max-h-48 overflow-auto rounded-lg bg-issues-bg p-3 font-mono text-xs text-muted-foreground">
              {event.stack.split("\n").slice(0, 10).join("\n")}
              {event.stack.split("\n").length > 10 && (
                <span className="text-pulse-muted">
                  {"\n"}... ({event.stack.split("\n").length - 10} more frames)
                </span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-issues-border/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-4 w-4 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 w-16 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 w-12 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 flex-1 animate-pulse rounded bg-issues-surface" />
        </div>
      ))}
    </div>
  );
}

export function EventLog({
  events,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  projectSlug,
  isLoading,
  className,
}: EventLogProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-issues-border bg-issues-surface/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-issues-border bg-issues-surface/50 px-4 py-3">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
          Event Log
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalCount.toLocaleString()} total
        </span>
      </div>

      {/* Events list */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : events.length > 0 ? (
        <div className="divide-y divide-issues-border/50">
          {events.map((event, index) => (
            <EventRow
              key={event.id}
              event={event}
              index={index}
              projectSlug={projectSlug}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No events found
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-issues-border bg-issues-surface/30 px-4 py-3">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-issues-border bg-issues-surface px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-issues-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Prev
          </button>

          <span className="px-4 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-issues-border bg-issues-surface px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-issues-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
