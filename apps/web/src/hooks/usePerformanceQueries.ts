import { trpc } from "@/lib/trpc/client";
import type { PerformanceDateRange } from "@/server/api/types";

export function usePerformanceQueries(
  projectId: string | null,
  dateRange: PerformanceDateRange,
  isServerSide: boolean
) {
  const enabled = !!projectId;

  const webVitals = trpc.performance.getWebVitals.useQuery(
    { projectId: projectId!, dateRange },
    { enabled: enabled && !isServerSide }
  );

  const transactionsData = trpc.performance.getTransactions.useQuery(
    { projectId: projectId!, page: 1, limit: 20 },
    { enabled }
  );

  const spanAnalysis = trpc.performance.getSpanAnalysis.useQuery(
    { projectId: projectId!, dateRange },
    { enabled: isServerSide && enabled }
  );

  const apdexData = trpc.performance.getApdex.useQuery(
    { projectId: projectId!, dateRange },
    { enabled: isServerSide && enabled }
  );

  const serverStats = trpc.performance.getServerStats.useQuery(
    { projectId: projectId!, dateRange },
    { enabled: isServerSide && enabled }
  );

  return { webVitals, transactionsData, spanAnalysis, apdexData, serverStats };
}
