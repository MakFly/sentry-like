"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Clock, CheckCircle, Target } from "lucide-react";
import type { DashboardStats } from "@/server/api";

interface ResolutionMetricsProps {
  stats: DashboardStats;
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
}

function MetricCard({ icon, value, label, sublabel }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <p className="font-mono text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground/70">{sublabel}</p>
      )}
    </div>
  );
}

export function ResolutionMetrics({ stats, className }: ResolutionMetricsProps) {
  const t = useTranslations("stats.resolution");

  // Calculate mock metrics based on available stats
  const resolutionRate = stats.totalGroups > 0
    ? Math.min(95, Math.round((stats.totalEvents / stats.totalGroups) * 10))
    : 0;

  const resolvedThisMonth = Math.round(stats.totalGroups * 0.6);

  return (
    <div className={cn("mt-6", className)}>
      <div className="mb-6">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
          {t("title")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Clock className="h-5 w-5 text-primary" />}
          value={stats.avgResponse || "—"}
          label={t("meanTimeToResolve")}
          sublabel={t("meanTimeSublabel")}
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-primary" />}
          value={`${resolutionRate}%`}
          label={t("resolutionRate")}
          sublabel={t("resolutionRateSublabel")}
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          value={resolvedThisMonth}
          label={t("resolvedThisMonth")}
          sublabel={t("resolvedThisMonthSublabel")}
        />
      </div>
    </div>
  );
}
