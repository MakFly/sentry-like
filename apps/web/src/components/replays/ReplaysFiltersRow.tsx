"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Film, X } from "lucide-react";
import type { ErrorLevel } from "@/server/api";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

interface ReplaysFiltersRowProps {
  search: string;
  onSearchChange: (value: string) => void;
  browser: string;
  onBrowserChange: (value: string) => void;
  os: string;
  onOsChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  severity: string;
  onSeverityChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function ReplaysFiltersRow({
  search,
  onSearchChange,
  browser,
  onBrowserChange,
  os,
  onOsChange,
  dateRange,
  onDateRangeChange,
  severity,
  onSeverityChange,
  onClear,
  hasActiveFilters,
  className,
}: ReplaysFiltersRowProps) {
  const t = useTranslations("replays.filters");

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {/* Search by URL */}
      <div className="relative flex-1 sm:max-w-sm">
        <Film className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("searchByUrl")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-issues-border bg-issues-surface/50 py-2 pl-10 pr-4 text-sm",
            "placeholder:text-muted-foreground/50",
            "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
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

      {/* Browser */}
      <Select value={browser} onValueChange={onBrowserChange}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
          <SelectValue placeholder={t("allBrowsers")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allBrowsers")}</SelectItem>
          <SelectItem value="Chrome">Chrome</SelectItem>
          <SelectItem value="Safari">Safari</SelectItem>
          <SelectItem value="Firefox">Firefox</SelectItem>
          <SelectItem value="Edge">Edge</SelectItem>
        </SelectContent>
      </Select>

      {/* OS */}
      <Select value={os} onValueChange={onOsChange}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
          <SelectValue placeholder={t("allOS")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allOS")}</SelectItem>
          <SelectItem value="Windows">Windows</SelectItem>
          <SelectItem value="macOS">macOS</SelectItem>
          <SelectItem value="Linux">Linux</SelectItem>
          <SelectItem value="iOS">iOS</SelectItem>
          <SelectItem value="Android">Android</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRange)}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
          <SelectValue placeholder={t("timeRange")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTime")}</SelectItem>
          <SelectItem value="24h">{t("last24h")}</SelectItem>
          <SelectItem value="7d">{t("last7d")}</SelectItem>
          <SelectItem value="30d">{t("last30d")}</SelectItem>
          <SelectItem value="90d">{t("last90d")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Severity */}
      <Select value={severity} onValueChange={onSeverityChange}>
        <SelectTrigger className="w-full border-issues-border bg-issues-surface/50 sm:w-[130px]">
          <SelectValue placeholder={t("allSeverity")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allSeverity")}</SelectItem>
          <SelectItem value="fatal">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-fatal" />
              {t("severityFatal")}
            </span>
          </SelectItem>
          <SelectItem value="error">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-error" />
              {t("severityError")}
            </span>
          </SelectItem>
          <SelectItem value="warning">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-warning" />
              {t("severityWarning")}
            </span>
          </SelectItem>
          <SelectItem value="info">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-info" />
              {t("severityInfo")}
            </span>
          </SelectItem>
          <SelectItem value="debug">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-debug" />
              {t("severityDebug")}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-issues-border bg-issues-surface/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-issues-surface hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          {t("clear")}
        </button>
      )}
    </div>
  );
}
