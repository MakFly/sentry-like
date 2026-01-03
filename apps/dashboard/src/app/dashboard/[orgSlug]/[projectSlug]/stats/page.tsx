"use client";

import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { StatsPageClient } from "./client";

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-dashboard-surface/50" />
      <div className="h-64 animate-pulse rounded-xl bg-dashboard-surface/50" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-xl bg-dashboard-surface/50 lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-xl bg-dashboard-surface/50" />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();

  // Fetch stats data
  const { data: stats, isLoading: statsLoading } = trpc.stats.getDashboardStats.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );

  const { data: timeline } = trpc.stats.getTimeline.useQuery(
    { range: "30d", projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );

  const { data: envBreakdown } = trpc.stats.getEnvBreakdown.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );

  const { data: insights } = trpc.stats.getInsights.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );

  const isLoading = projectLoading || statsLoading || !stats;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <StatsPageClient
      projectId={currentProjectId || ""}
      initialStats={stats}
      initialTimeline={timeline || []}
      initialEnvBreakdown={envBreakdown || []}
      initialInsights={insights || []}
    />
  );
}
