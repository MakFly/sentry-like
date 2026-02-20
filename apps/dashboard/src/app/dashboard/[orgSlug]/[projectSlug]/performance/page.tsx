"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { WebVitalsCards, SlowestTable, TransactionsTable } from "@/components/performance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PerformanceDateRange } from "@/server/api/types";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function ServerPerformanceSummary({ durations }: { durations: number[] }) {
  const stats = useMemo(() => {
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      count: sorted.length,
    };
  }, [durations]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { label: "p50", value: stats.p50 },
        { label: "p95", value: stats.p95 },
        { label: "p99", value: stats.p99 },
      ].map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Server Response Time ({label})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatMs(value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.count} transaction{stats.count !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-dashboard-surface/50" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-dashboard-surface/50" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-dashboard-surface/50" />
      <div className="h-64 animate-pulse rounded-xl bg-dashboard-surface/50" />
    </div>
  );
}

export default function PerformancePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;
  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;

  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();
  const [dateRange, setDateRange] = useState<PerformanceDateRange>("24h");
  const [opFilter, setOpFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: webVitals, isLoading: vitalsLoading } =
    trpc.performance.getWebVitals.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  const { data: slowest, isLoading: slowestLoading } =
    trpc.performance.getSlowest.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  const { data: transactionsData, isLoading: transactionsLoading } =
    trpc.performance.getTransactions.useQuery(
      {
        projectId: currentProjectId!,
        op: opFilter || undefined,
        page,
        limit: 20,
      },
      { enabled: !!currentProjectId }
    );

  const isLoading = projectLoading || vitalsLoading;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <div className="flex items-center gap-3">
          {/* Op filter */}
          <input
            type="text"
            placeholder="Filter by op..."
            value={opFilter}
            onChange={(e) => {
              setOpFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[160px] rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {/* Date range */}
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as PerformanceDateRange)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Web Vitals */}
      <WebVitalsCards vitals={webVitals || []} />

      {/* Server Performance Summary — shown when no Web Vitals but transactions exist */}
      {(!webVitals || webVitals.length === 0) &&
        transactionsData &&
        transactionsData.transactions.length > 0 && (
          <ServerPerformanceSummary
            durations={transactionsData.transactions.map((t) => t.duration)}
          />
        )}

      {/* Tabs for Transactions */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="slowest">Slowest</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {!transactionsLoading && transactionsData && (
            <TransactionsTable
              transactions={transactionsData.transactions}
              pagination={transactionsData.pagination}
              baseUrl={baseUrl}
              onPageChange={setPage}
            />
          )}
        </TabsContent>

        <TabsContent value="slowest">
          {!slowestLoading && <SlowestTable transactions={slowest || []} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
