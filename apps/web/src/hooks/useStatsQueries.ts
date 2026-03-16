import { trpc } from "@/lib/trpc/client";

export function useStatsQueries(projectId: string | null, options?: { timelineRange?: "24h" | "7d" | "30d" }) {
  const range = options?.timelineRange ?? "24h";
  const enabled = !!projectId;

  const stats = trpc.stats.getDashboardStats.useQuery(
    { projectId: projectId || undefined },
    { enabled }
  );

  const timeline = trpc.stats.getTimeline.useQuery(
    { range, projectId: projectId || undefined },
    { enabled }
  );

  const envBreakdown = trpc.stats.getEnvBreakdown.useQuery(
    { projectId: projectId || undefined },
    { enabled }
  );

  const severityBreakdown = trpc.stats.getSeverityBreakdown.useQuery(
    { projectId: projectId || undefined },
    { enabled }
  );

  return { stats, timeline, envBreakdown, severityBreakdown };
}
