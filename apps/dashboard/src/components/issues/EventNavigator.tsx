"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Play, Circle, Clock, Globe, ChevronRight } from "lucide-react";

interface EventData {
  id: string;
  sessionId: string | null;
  createdAt: Date | string;
  url: string | null;
  stack: string | null;
}

interface EventNavigatorProps {
  events: EventData[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  projectSlug: string;
  className?: string;
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getUrlPath(url: string | null): string {
  if (!url) return "—";
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return url.slice(0, 30);
  }
}

export function EventNavigator({
  events,
  selectedEventId,
  onSelectEvent,
  projectSlug,
  className,
}: EventNavigatorProps) {
  const eventsWithReplay = events.filter((e) => e.sessionId);
  const replayCount = eventsWithReplay.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-issues-border bg-issues-surface/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-issues-border bg-issues-surface/50 px-4 py-3">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
          Events ({events.length})
        </h3>
        {replayCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse-primary/10 px-2.5 py-1 text-xs font-medium text-pulse-primary">
            <Play className="h-3 w-3 fill-current" />
            {replayCount} replay{replayCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Events list */}
      <div className="divide-y divide-issues-border">
        {events.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No events recorded
          </div>
        ) : (
          events.map((event) => {
            const isSelected = event.id === selectedEventId;
            const hasReplay = !!event.sessionId;

            return (
              <div
                key={event.id}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-pulse-primary/5 border-l-2 border-l-pulse-primary"
                    : "hover:bg-issues-surface/50 border-l-2 border-l-transparent"
                )}
                onClick={() => onSelectEvent(event.id)}
              >
                {/* Selection indicator */}
                <Circle
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 transition-colors",
                    isSelected
                      ? "fill-pulse-primary text-pulse-primary"
                      : "text-muted-foreground"
                  )}
                />

                {/* Time */}
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{formatTime(event.createdAt)}</span>
                  <span className="text-muted-foreground/50">
                    {formatDate(event.createdAt)}
                  </span>
                </div>

                {/* URL */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <code className="truncate font-mono text-xs text-muted-foreground">
                    {getUrlPath(event.url)}
                  </code>
                </div>

                {/* Replay button or indicator */}
                {hasReplay ? (
                  <Link
                    href={`/dashboard/${projectSlug}/replays/${event.sessionId}?errorTime=${new Date(event.createdAt).toISOString()}&errorEventId=${event.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-pulse-primary px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-pulse-primary/20 transition-all hover:bg-pulse-primary/90 hover:shadow-pulse-primary/30"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Replay
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground/50">
                    no replay
                  </span>
                )}

                {/* Chevron for selection */}
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isSelected ? "text-pulse-primary" : "text-muted-foreground/30"
                  )}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
