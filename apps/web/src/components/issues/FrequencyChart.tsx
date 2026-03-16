"use client";

import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimelinePoint {
  date: string;
  count: number;
}

interface EnvBreakdown {
  env: string;
  count: number;
}

interface FrequencyChartProps {
  timeline: TimelinePoint[];
  envBreakdown?: EnvBreakdown[];
  className?: string;
}

const envColors: Record<string, string> = {
  prod: "bg-signal-fatal",
  production: "bg-signal-fatal",
  staging: "bg-signal-warning",
  dev: "bg-signal-info",
  development: "bg-signal-info",
  test: "bg-signal-debug",
  local: "bg-pulse-muted",
};

export function FrequencyChart({
  timeline,
  envBreakdown,
  className,
}: FrequencyChartProps) {
  const t = useTranslations("issueDetail.frequencyChart");

  // Calculate max for scaling
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);
  const totalEvents = timeline.reduce((sum, t) => sum + t.count, 0);

  // Find peak day
  const peakDay = timeline.reduce(
    (max, t) => (t.count > max.count ? t : max),
    timeline[0] || { date: "", count: 0 }
  );

  const avgPerDay = Math.round(totalEvents / Math.max(timeline.length, 1));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Frequency section */}
      <div className="rounded-lg border border-issues-border bg-issues-surface/30 p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-pulse-primary" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            {t("title")}
          </h3>
        </div>

        {/* Bar chart */}
        {timeline.length > 0 ? (
          <>
            <div className="mb-4 flex h-24 items-end gap-0.5">
              {timeline.slice(-30).map((point, index) => {
                const height = (point.count / maxCount) * 100;
                const isPeak = point.date === peakDay.date;

                return (
                  <div
                    key={point.date}
                    className="group relative flex-1"
                    title={`${new Date(point.date).toLocaleDateString()}: ${point.count} events`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        isPeak ? "bg-pulse-secondary" : "bg-pulse-primary/60",
                        "hover:bg-pulse-primary"
                      )}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />

                    {/* Tooltip on hover */}
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-issues-bg px-2 py-1 text-xs shadow-lg group-hover:block">
                      {point.count}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="space-y-2 border-t border-issues-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("last30days")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("peak")}</span>
                <span className="font-mono text-foreground">
                  {peakDay.date
                    ? new Date(peakDay.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}{" "}
                  ({peakDay.count})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("avg")}</span>
                <span className="font-mono text-foreground">{t("perDay", { count: avgPerDay })}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        )}
      </div>

      {/* Environment breakdown */}
      {envBreakdown && envBreakdown.length > 0 && (
        <div className="rounded-lg border border-issues-border bg-issues-surface/30 p-4">
          <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            {t("byEnvironment")}
          </h3>

          <div className="space-y-3">
            {envBreakdown.map((env) => {
              const total = envBreakdown.reduce((sum, e) => sum + e.count, 0);
              const percentage = Math.round((env.count / total) * 100);

              return (
                <div key={env.env} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          envColors[env.env] || "bg-pulse-muted"
                        )}
                      />
                      <span className="text-foreground">{env.env}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {env.count.toLocaleString()} ({percentage}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-issues-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        envColors[env.env] || "bg-pulse-muted"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
