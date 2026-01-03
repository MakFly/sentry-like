"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Activity, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { BreadcrumbsTimeline } from "@/components/BreadcrumbsTimeline";

interface BreadcrumbsSectionProps {
  breadcrumbs: string | null;
  errorTimestamp?: Date | string;
  defaultExpanded?: boolean;
  className?: string;
}

export function BreadcrumbsSection({
  breadcrumbs,
  errorTimestamp,
  defaultExpanded = true,
  className,
}: BreadcrumbsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Parse breadcrumbs to check if we have data
  let breadcrumbsArray: unknown[] = [];
  if (breadcrumbs && breadcrumbs !== "null") {
    try {
      breadcrumbsArray = JSON.parse(breadcrumbs);
    } catch {
      // Invalid JSON
    }
  }

  if (!breadcrumbsArray || breadcrumbsArray.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-xl border border-issues-border bg-issues-surface/30 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-issues-surface/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-primary/10 border border-pulse-primary/30">
            <Activity className="h-4 w-4 text-pulse-primary" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
              User Actions Trail
            </h3>
            <p className="text-xs text-muted-foreground">
              {breadcrumbsArray.length} actions before the error
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Error marker */}
          <div className="flex items-center gap-1.5 rounded-md border border-signal-error/30 bg-signal-error/10 px-2 py-1">
            <AlertCircle className="h-3 w-3 text-signal-error" />
            <span className="text-xs font-medium text-signal-error">
              {errorTimestamp
                ? new Date(errorTimestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })
                : "Error"}
            </span>
          </div>

          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-issues-border">
          <BreadcrumbsTimeline
            breadcrumbs={breadcrumbs}
            maxItems={20}
            className="border-0 rounded-none bg-transparent"
          />
        </div>
      )}
    </div>
  );
}
