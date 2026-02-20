"use client";

import { Suspense } from "react";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { NoProjectDashboard } from "@/components/NoProjectDashboard";
import {
  HealthStrip,
  StatusTile,
  AttentionQueue,
  ErrorSeverityChart,
} from "@/components/dashboard";
import Sparkline from "@/components/Sparkline";
import { useStatsQueries } from "@/hooks/useStatsQueries";
import { normalizeGroups } from "@/lib/utils/normalize-groups";
import { trpc } from "@/lib/trpc/client";
import type { ErrorGroup } from "@/server/api";

function DashboardContent() {
  const { currentProjectId, currentProject, isLoading: projectLoading, orgProjects } = useCurrentProject();
  const { currentOrgSlug, isLoading: orgLoading } = useCurrentOrganization();

  const isLoading = projectLoading || orgLoading;

  // Fetch stats when we have a project
  const { stats, timeline, envBreakdown, severityBreakdown } = useStatsQueries(currentProjectId);

  const { data: groups } = trpc.groups.getAll.useQuery(
    { projectId: currentProjectId || undefined, dateRange: "24h" },
    { enabled: !!currentProjectId }
  );

  if (isLoading) {
    return null;
  }

  // No projects in this org
  if (!currentProjectId || orgProjects.length === 0) {
    return <NoProjectDashboard />;
  }

  const statsData = stats.data || { totalEvents: 0, todayEvents: 0, totalGroups: 0, avgEventsPerGroup: 0, newIssues24h: 0 };
  const timelineData = timeline.data || [];
  const envBreakdownData = envBreakdown.data || [];
  const groupsData = normalizeGroups<ErrorGroup>(groups);

  // Calculate health score
  const healthScore = Math.max(
    0,
    Math.min(100, 100 - Math.round(statsData.avgEventsPerGroup * 2))
  );

  const errorRate = statsData.todayEvents > 0 ? Math.min(10, statsData.todayEvents / 100) : 0;

  // Sparkline data
  const sparklineData = timelineData.slice(-24).map((p) => p.events);
  const totalEvents = timelineData.reduce((sum, p) => sum + p.events, 0);
  const peak = timelineData.reduce(
    (max, p, idx) => (p.events > max.value ? { value: p.events, idx } : max),
    { value: 0, idx: 0 }
  );
  const peakTime = timelineData[peak.idx]?.date
    ? new Date(timelineData[peak.idx].date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const avgPerHour = Math.round(totalEvents / Math.max(timelineData.length, 1));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Health Strip */}
      <HealthStrip
        errorRate={errorRate}
        healthScore={healthScore}
        totalEvents={statsData.totalEvents}
      />

      {/* Status Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusTile type="unresolved" value={statsData.totalGroups} delta={-3} />
        <StatusTile type="today" value={statsData.todayEvents} delta="+12%" />
        <StatusTile type="new24h" value={statsData.newIssues24h} />
      </div>

      {/* Pulse Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-dashboard-border bg-dashboard-surface/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pulse (Last 24h)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Peak: <span className="font-mono text-foreground">{peakTime}</span>
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Avg: <span className="font-mono text-foreground">{avgPerHour}/hr</span>
              </span>
            </div>
          </div>
          <Sparkline
            data={sparklineData}
            width={600}
            height={60}
            color="hsl(var(--status-warning))"
            fillOpacity={0.15}
            className="w-full"
          />
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface/30 p-4">
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Environments
          </h3>
          <div className="space-y-2">
            {envBreakdownData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              envBreakdownData.slice(0, 4).map((env, idx) => (
                <div key={env.env} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        idx === 0 ? "bg-status-critical" : "bg-muted-foreground/50"
                      }`}
                    />
                    <span className="font-mono text-sm text-foreground">
                      {env.env}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    {env.count.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Error Severity Distribution */}
      {severityBreakdown.data && severityBreakdown.data.length > 0 && (
        <ErrorSeverityChart data={severityBreakdown.data} />
      )}

      {/* Attention Queue */}
      <Suspense fallback={null}>
        <AttentionQueue
          errors={groupsData.slice(0, 5)}
          orgSlug={currentOrgSlug || ""}
          projectSlug={currentProject?.slug || ""}
        />
      </Suspense>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
