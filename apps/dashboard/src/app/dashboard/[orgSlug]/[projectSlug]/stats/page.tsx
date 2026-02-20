"use client";

import { useCurrentProject } from "@/contexts/ProjectContext";
import { useStatsQueries } from "@/hooks/useStatsQueries";
import { trpc } from "@/lib/trpc/client";
import { StatsPageClient } from "./client";

export default function StatsPage() {
  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();

  const { stats, timeline, envBreakdown } = useStatsQueries(currentProjectId, { timelineRange: "30d" });

  const { data: insights } = trpc.stats.getInsights.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );

  const isLoading = projectLoading || stats.isLoading || !stats.data;

  if (isLoading) {
    return null;
  }

  return (
    <StatsPageClient
      projectId={currentProjectId || ""}
      initialStats={stats.data!}
      initialTimeline={timeline.data || []}
      initialEnvBreakdown={envBreakdown.data || []}
      initialInsights={insights || []}
    />
  );
}
