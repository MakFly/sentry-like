"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Radio } from "lucide-react";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

interface FiltersRowProps {
  search: string;
  onSearchChange: (value: string) => void;
  environment: string;
  onEnvironmentChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  status: string;
  onStatusChange: (value: string) => void;
  source?: string;
  onSourceChange?: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function FiltersRow({
  search,
  onSearchChange,
  environment,
  onEnvironmentChange,
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  onClear,
  hasActiveFilters,
  className,
}: FiltersRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className
      )}
    >
      {/* Search */}
      <div className="relative flex-1 sm:max-w-sm">
        <Radio className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pulse-muted" />
        <input
          type="text"
          placeholder="Search signals..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-issues-border bg-issues-surface/50 py-2 pl-10 pr-4 text-sm",
            "placeholder:text-muted-foreground/50",
            "focus:border-pulse-primary/50 focus:outline-none focus:ring-2 focus:ring-pulse-primary/20",
            "transition-all"
          )}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Environment */}
      <Select value={environment} onValueChange={onEnvironmentChange}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[140px]">
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All envs</SelectItem>
          <SelectItem value="prod">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-fatal" />
              Production
            </span>
          </SelectItem>
          <SelectItem value="staging">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-warning" />
              Staging
            </span>
          </SelectItem>
          <SelectItem value="dev">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-info" />
              Development
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRange)}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="24h">Last 24h</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="ignored">Ignored</SelectItem>
        </SelectContent>
      </Select>

      {/* Source */}
      {onSourceChange && (
        <Select value={source || "all"} onValueChange={onSourceChange}>
          <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="http">HTTP</SelectItem>
            <SelectItem value="cli">CLI</SelectItem>
            <SelectItem value="messenger">Queue</SelectItem>
            <SelectItem value="deprecation">Deprecation</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-issues-border bg-issues-surface/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-issues-surface hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
