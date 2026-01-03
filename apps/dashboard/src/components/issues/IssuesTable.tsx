"use client";

import { cn } from "@/lib/utils";
import { IssueRow } from "./IssueRow";
import { CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import type { ErrorLevel } from "@/server/api";

interface IssueGroup {
  fingerprint: string;
  message: string;
  file: string;
  line: number;
  level: ErrorLevel;
  count: number;
  lastSeen: Date;
  firstSeen: Date;
  hasReplay?: boolean;
}

interface IssuesTableProps {
  issues: IssueGroup[];
  projectSlug: string;
  isLoading?: boolean;
  className?: string;
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-issues-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-6 w-6 animate-pulse rounded bg-issues-surface" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 flex-1 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 w-24 animate-pulse rounded bg-issues-surface" />
          <div className="h-4 w-16 animate-pulse rounded bg-issues-surface" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-signal-info/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-signal-info/20 bg-gradient-to-br from-signal-info/20 to-signal-info/5">
          <CheckCircle2 className="h-8 w-8 text-signal-info" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-semibold tracking-tight">
        {hasFilters ? "No matching signals" : "All clear"}
      </h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters to see more results."
          : "No signals detected. Your application is running smoothly."}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-signal-error/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-signal-error/20 bg-gradient-to-br from-signal-error/20 to-signal-error/5">
          <AlertTriangle className="h-8 w-8 text-signal-error" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-semibold tracking-tight text-signal-error">
        Failed to load signals
      </h3>
      <p className="mt-2 max-w-sm text-center font-mono text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

export function IssuesTable({
  issues,
  projectSlug,
  isLoading,
  className,
}: IssuesTableProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-issues-border bg-issues-surface/20",
          className
        )}
      >
        <TableSkeleton />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-issues-border bg-issues-surface/20",
          className
        )}
      >
        <EmptyState hasFilters={false} />
      </div>
    );
  }

  // Calculate max count for relative strength bars
  const maxCount = Math.max(...issues.map((i) => i.count));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-issues-border bg-issues-surface/20",
        className
      )}
    >
      {/* Table header */}
      <div className="flex items-center gap-4 border-b border-issues-border bg-issues-surface/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="w-6 shrink-0" /> {/* Expand toggle */}
        <div className="w-20 shrink-0">Signal</div>
        <div className="min-w-0 flex-1 overflow-hidden">Message</div>
        <div className="hidden w-24 shrink-0 lg:block">Strength</div>
        <div className="hidden w-40 shrink-0 md:block">Source</div>
        <div className="hidden w-10 shrink-0 sm:block text-center">Replay</div>
        <div className="w-16 shrink-0 text-right">Freq</div>
        <div className="hidden w-16 shrink-0 text-right sm:block">Last</div>
        <div className="w-8 shrink-0" /> {/* Actions */}
      </div>

      {/* Table body */}
      <div className="divide-y divide-issues-border/50">
        {issues.map((issue) => (
          <IssueRow
            key={issue.fingerprint}
            fingerprint={issue.fingerprint}
            message={issue.message}
            file={issue.file}
            line={issue.line}
            level={issue.level}
            count={issue.count}
            lastSeen={issue.lastSeen}
            projectSlug={projectSlug}
            maxCount={maxCount}
            hasReplay={issue.hasReplay}
          />
        ))}
      </div>
    </div>
  );
}

export { EmptyState, ErrorState };
