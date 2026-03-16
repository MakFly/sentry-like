"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { WebVitalsCards } from "@/components/performance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PerformanceDateRange } from "@/server/api/types";

export default function WebVitalsPage() {
  const t = useTranslations("performance");
  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();
  const [dateRange, setDateRange] = useState<PerformanceDateRange>("24h");

  const { data: webVitals, isLoading: vitalsLoading } =
    trpc.performance.getWebVitals.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  if (projectLoading || vitalsLoading) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("webVitals.title")}</h1>
        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as PerformanceDateRange)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{t("dateRange.last24h")}</SelectItem>
            <SelectItem value="7d">{t("dateRange.last7d")}</SelectItem>
            <SelectItem value="30d">{t("dateRange.last30d")}</SelectItem>
            <SelectItem value="90d">{t("dateRange.last90d")}</SelectItem>
            <SelectItem value="6m">{t("dateRange.last6m")}</SelectItem>
            <SelectItem value="1y">{t("dateRange.lastYear")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <WebVitalsCards vitals={webVitals || []} />
    </div>
  );
}
