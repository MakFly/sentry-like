import { useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import type { InfraDateRange, InfraMetricsHistory, InfraMetricsSnapshot } from "@/server/api/types";

const API_URL = process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333";

export function useInfrastructureQueries(
  projectId: string | null,
  options?: { hostId?: string | null; dateRange?: InfraDateRange }
) {
  const enabled = !!projectId;
  const hostId = options?.hostId ?? null;
  const dateRange = options?.dateRange ?? "1h";
  const queryClient = useQueryClient();

  const hosts = trpc.infrastructure.getHosts.useQuery(
    { projectId: projectId! },
    { enabled, refetchOnWindowFocus: true, staleTime: 30_000 }
  );

  const latest = trpc.infrastructure.getLatest.useQuery(
    { projectId: projectId! },
    { enabled, refetchInterval: 30_000, staleTime: 15_000 }
  );

  const history = trpc.infrastructure.getHistory.useQuery(
    { projectId: projectId!, hostId: hostId!, dateRange },
    { enabled: enabled && !!hostId, refetchInterval: 60_000, staleTime: 30_000 }
  );

  // SSE real-time stream
  const handleSseMetrics = useCallback(
    (data: any) => {
      if (!projectId || !hostId) return;

      // Only process metrics for the selected host
      if (data.hostId !== hostId) return;

      const newPoint: InfraMetricsHistory = {
        timestamp: data.timestamp,
        cpu: data.cpu,
        memory: data.memory,
        disks: data.disks,
        networks: data.networks,
      };

      // Append to history cache
      const historyKey = [["infrastructure", "getHistory"], { input: { projectId, hostId, dateRange }, type: "query" }];
      queryClient.setQueryData<InfraMetricsHistory[]>(historyKey, (old) => {
        if (!old) return [newPoint];
        // Deduplicate by timestamp
        if (old.length > 0 && old[old.length - 1].timestamp === newPoint.timestamp) return old;
        return [...old, newPoint];
      });

      // Update latest cache
      const latestKey = [["infrastructure", "getLatest"], { input: { projectId }, type: "query" }];
      queryClient.setQueryData<InfraMetricsSnapshot[]>(latestKey, (old) => {
        if (!old) return old;
        return old.map((s) =>
          s.hostId === data.hostId
            ? { ...s, cpu: data.cpu, memory: data.memory, disks: data.disks, networks: data.networks, timestamp: data.timestamp }
            : s
        );
      });
    },
    [projectId, hostId, dateRange, queryClient]
  );

  useEffect(() => {
    if (!projectId) return;

    const url = `${API_URL}/api/v1/infrastructure/stream?projectId=${projectId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("metrics", (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSseMetrics(data);
      } catch {
        // Ignore malformed SSE data
      }
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects; no action needed
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, handleSseMetrics]);

  return { hosts, latest, history };
}
