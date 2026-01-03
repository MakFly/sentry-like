"use client";

import { cn } from "@/lib/utils";

interface HealthStripProps {
  errorRate: number; // Percentage 0-100
  healthScore: number; // 0-100
  totalEvents: number;
  className?: string;
}

export function HealthStrip({
  errorRate,
  healthScore,
  totalEvents,
  className,
}: HealthStripProps) {
  // Determine color based on health score
  const getHealthColor = (score: number) => {
    if (score >= 90) return "bg-status-healthy";
    if (score >= 70) return "bg-status-caution";
    if (score >= 50) return "bg-status-warning";
    return "bg-status-critical";
  };

  const getHealthTextColor = (score: number) => {
    if (score >= 90) return "text-status-healthy";
    if (score >= 70) return "text-status-caution";
    if (score >= 50) return "text-status-warning";
    return "text-status-critical";
  };

  // Error rate change indicator (mock for now - would come from API)
  const errorRateChange = 0.4 as number;
  const isIncreasing = errorRateChange > 0;

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-dashboard-border bg-dashboard-surface/30 p-4",
        className
      )}
    >
      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-dashboard-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getHealthColor(healthScore)
          )}
          style={{ width: `${healthScore}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Error rate */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Error Rate:</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {errorRate.toFixed(1)}%
            </span>
            {errorRateChange !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-mono text-xs",
                  isIncreasing ? "text-status-critical" : "text-status-healthy"
                )}
              >
                <svg
                  className={cn("h-3 w-3", !isIncreasing && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                {Math.abs(errorRateChange).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Separator */}
          <div className="hidden h-4 w-px bg-dashboard-border sm:block" />

          {/* Total events */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Events:</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {totalEvents.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Health score */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Health:</span>
          <span
            className={cn(
              "font-mono text-lg font-bold",
              getHealthTextColor(healthScore)
            )}
          >
            {healthScore}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
    </div>
  );
}
