"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3 } from "lucide-react";
import type { TimelineRange } from "@/server/api";

interface StatsHeaderProps {
  dateRange: TimelineRange;
  onRangeChange: (range: TimelineRange) => void;
  className?: string;
}

export function StatsHeader({
  dateRange,
  onRangeChange,
  className,
}: StatsHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Title section */}
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
          Statistics
        </h1>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range selector */}
        <Select value={dateRange} onValueChange={(v) => onRangeChange(v as TimelineRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        {/* Export button */}
        <button
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => {
            console.log("Export stats");
          }}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
