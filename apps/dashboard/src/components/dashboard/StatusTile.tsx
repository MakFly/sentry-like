"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  Bug,
  type LucideIcon,
} from "lucide-react";

type StatusType = "critical" | "unresolved" | "today" | "new24h";

interface StatusTileProps {
  type: StatusType;
  value: number | string;
  delta?: number | string;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  {
    icon: LucideIcon;
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    label: "CRITICAL",
    colorClass: "text-status-critical",
    bgClass: "bg-status-critical/10",
    borderClass: "border-status-critical/30",
  },
  unresolved: {
    icon: AlertCircle,
    label: "UNRESOLVED",
    colorClass: "text-status-warning",
    bgClass: "bg-status-warning/10",
    borderClass: "border-status-warning/30",
  },
  today: {
    icon: Activity,
    label: "TODAY",
    colorClass: "text-frost",
    bgClass: "bg-frost/10",
    borderClass: "border-frost/30",
  },
  new24h: {
    icon: Bug,
    label: "NEW 24H",
    colorClass: "text-status-caution",
    bgClass: "bg-status-caution/10",
    borderClass: "border-status-caution/30",
  },
};

export function StatusTile({ type, value, delta, className }: StatusTileProps) {
  const config = statusConfig[type];
  const Icon = config.icon;

  // Parse delta for display
  const getDeltaDisplay = () => {
    if (delta === undefined || delta === null) return null;

    if (typeof delta === "string") {
      return { text: delta, isPositive: delta.startsWith("-") };
    }

    if (delta === 0) return { text: "═", isPositive: null };
    if (delta > 0) return { text: `▲${delta}`, isPositive: false };
    return { text: `▼${Math.abs(delta)}`, isPositive: true };
  };

  const deltaDisplay = getDeltaDisplay();

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border p-4 transition-all",
        "bg-dashboard-surface/50 hover:bg-dashboard-surface",
        config.borderClass,
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("rounded-md p-1.5", config.bgClass)}>
          <Icon className={cn("h-4 w-4", config.colorClass)} />
        </div>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {config.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>

        {/* Delta indicator */}
        {deltaDisplay && (
          <span
            className={cn(
              "font-mono text-xs font-medium",
              deltaDisplay.isPositive === true && "text-status-healthy",
              deltaDisplay.isPositive === false && "text-status-critical",
              deltaDisplay.isPositive === null && "text-muted-foreground"
            )}
          >
            {deltaDisplay.text}
          </span>
        )}
      </div>
    </div>
  );
}
