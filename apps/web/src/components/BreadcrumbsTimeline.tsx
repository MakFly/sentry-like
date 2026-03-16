"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Navigation,
  Terminal,
  Globe,
  User,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";

type BreadcrumbCategory = "ui" | "navigation" | "console" | "http" | "user";
type BreadcrumbLevel = "debug" | "info" | "warning" | "error";

interface Breadcrumb {
  timestamp: number;
  category: BreadcrumbCategory;
  type?: string;
  level?: BreadcrumbLevel;
  message?: string;
  data?: Record<string, any>;
}

interface BreadcrumbsTimelineProps {
  breadcrumbs: Breadcrumb[] | string | null;
  maxItems?: number;
  className?: string;
}

const CATEGORY_CONFIG: Record<
  BreadcrumbCategory,
  {
    icon: typeof MousePointer2;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  ui: {
    icon: MousePointer2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    label: "UI",
  },
  navigation: {
    icon: Navigation,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    label: "Navigation",
  },
  console: {
    icon: Terminal,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    label: "Console",
  },
  http: {
    icon: Globe,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    label: "HTTP",
  },
  user: {
    icon: User,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    label: "User",
  },
};

const LEVEL_COLORS: Record<BreadcrumbLevel, string> = {
  debug: "text-gray-400",
  info: "text-blue-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatRelativeTime(timestamp: number, referenceTime?: number): string {
  const ref = referenceTime || Date.now();
  const diff = ref - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s before`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s before`;
  return formatTime(timestamp);
}

function BreadcrumbItem({
  breadcrumb,
  isLast,
  referenceTime,
}: {
  breadcrumb: Breadcrumb;
  isLast: boolean;
  referenceTime?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[breadcrumb.category] || CATEGORY_CONFIG.user;
  const Icon = config.icon;
  const hasData = breadcrumb.data && Object.keys(breadcrumb.data).length > 0;

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/50" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
          config.bg,
          config.border
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div
          className={cn(
            "rounded-lg border border-border/50 bg-card/30 overflow-hidden",
            hasData && "cursor-pointer hover:bg-card/50 transition-colors"
          )}
          onClick={() => hasData && setExpanded(!expanded)}
        >
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Message */}
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    breadcrumb.level && LEVEL_COLORS[breadcrumb.level]
                  )}
                >
                  {breadcrumb.message || breadcrumb.type || config.label}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "text-xs font-medium uppercase px-1.5 py-0.5 rounded",
                      config.bg,
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  {breadcrumb.type && breadcrumb.type !== breadcrumb.message && (
                    <span className="text-xs text-muted-foreground">
                      {breadcrumb.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Time & expand */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(breadcrumb.timestamp, referenceTime)}
                </span>
                {hasData && (
                  expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Expanded data */}
          {expanded && hasData && (
            <div className="border-t border-border/50 p-3 bg-black/10">
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

export function BreadcrumbsTimeline({
  breadcrumbs: rawBreadcrumbs,
  maxItems = 50,
  className,
}: BreadcrumbsTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  // Parse breadcrumbs if string
  let breadcrumbs: Breadcrumb[] = [];
  if (typeof rawBreadcrumbs === "string") {
    try {
      breadcrumbs = JSON.parse(rawBreadcrumbs);
    } catch {
      return null;
    }
  } else if (Array.isArray(rawBreadcrumbs)) {
    breadcrumbs = rawBreadcrumbs;
  }

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  // Sort by timestamp (oldest first for timeline)
  const sortedBreadcrumbs = [...breadcrumbs].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Get reference time (last breadcrumb = closest to error)
  const referenceTime = sortedBreadcrumbs[sortedBreadcrumbs.length - 1]?.timestamp;

  // Limit display
  const displayBreadcrumbs = showAll
    ? sortedBreadcrumbs
    : sortedBreadcrumbs.slice(-maxItems);
  const hiddenCount = sortedBreadcrumbs.length - displayBreadcrumbs.length;

  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/30", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Breadcrumbs</h3>
          <span className="text-xs text-muted-foreground">
            ({breadcrumbs.length} actions)
          </span>
        </div>

        {/* Category legend */}
        <div className="hidden sm:flex items-center gap-3">
          {(Object.keys(CATEGORY_CONFIG) as BreadcrumbCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const count = breadcrumbs.filter((b) => b.category === cat).length;
            if (count === 0) return null;
            return (
              <div key={cat} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", config.bg.replace("/10", ""))} />
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto">
        {hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mb-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border/50 rounded-lg hover:bg-secondary/30 transition-colors"
          >
            Show {hiddenCount} earlier breadcrumbs
          </button>
        )}

        {displayBreadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem
            key={`${breadcrumb.timestamp}-${index}`}
            breadcrumb={breadcrumb}
            isLast={index === displayBreadcrumbs.length - 1}
            referenceTime={referenceTime}
          />
        ))}
      </div>
    </div>
  );
}

export default BreadcrumbsTimeline;
