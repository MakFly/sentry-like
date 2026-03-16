"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { usePerformanceQueries } from "@/hooks/usePerformanceQueries";
import { ApdexGauge } from "@/components/performance/ApdexGauge";
import { SpanBreakdownOverview, WebVitalsCards } from "@/components/performance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ArrowRight, Database, Globe, List } from "lucide-react";
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

function ServerPerformanceSummary({
  durations,
  throughput,
  errorRate,
}: {
  durations: number[];
  throughput?: number;
  errorRate?: number;
}) {
  const stats = useMemo(() => {
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      count: sorted.length,
    };
  }, [durations]);

  const cards = [
    { label: "p50", value: formatMs(stats.p50), sub: `${stats.count} txn${stats.count !== 1 ? "s" : ""}` },
    { label: "p95", value: formatMs(stats.p95) },
    { label: "p99", value: formatMs(stats.p99) },
  ];

  if (throughput !== undefined) {
    cards.push({ label: "Throughput", value: `${throughput.toFixed(1)}/min`, sub: "req/min" });
  }

  if (errorRate !== undefined) {
    cards.push({
      label: "Error Rate",
      value: `${errorRate}%`,
      sub: errorRate > 5 ? "Above threshold" : undefined,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ label, value, sub }) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label === "Error Rate" ? label : `Server Response Time (${label})`}
              {label === "Throughput" && (
                <span className="block text-xs text-muted-foreground/60 font-normal">Throughput</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold font-mono ${
              label === "Error Rate" && errorRate !== undefined && errorRate > 5
                ? "text-red-500"
                : ""
            }`}>
              {value}
            </p>
            {sub && (
              <p className={`mt-1 text-xs ${
                label === "Error Rate" && errorRate !== undefined && errorRate > 5
                  ? "text-red-400"
                  : "text-muted-foreground"
              }`}>
                {sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;
  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;

  const { currentProjectId, currentProject, isLoading: projectLoading } = useCurrentProject();
  const [dateRange, setDateRange] = useState<PerformanceDateRange>("24h");

  const platform = currentProject?.platform ?? "";
  const isServerSide = ["symfony", "laravel", "nodejs", "hono", "fastify"].includes(platform);

  const { webVitals, transactionsData, spanAnalysis, apdexData, serverStats } =
    usePerformanceQueries(currentProjectId, dateRange, isServerSide);

  const isLoading = projectLoading || (!isServerSide && webVitals.isLoading);

  if (isLoading) {
    return null;
  }

  const subPages = [
    {
      title: "Transactions",
      description: "View all transactions, grouped or individual, with filtering and pagination.",
      href: `${baseUrl}/performance/transactions`,
      icon: List,
    },
    {
      title: "Web Vitals",
      description: "Core Web Vitals metrics: LCP, FID, CLS, TTFB, INP.",
      href: `${baseUrl}/performance/web-vitals`,
      icon: Globe,
    },
    {
      title: "Database Queries",
      description: "Duplicate queries (N+1), slowest queries, and endpoint impact analysis.",
      href: `${baseUrl}/performance/queries`,
      icon: Database,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Performance Overview</h1>
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
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Server-side summary */}
      {isServerSide && (
        <>
          {transactionsData.data && transactionsData.data.transactions.length > 0 && (
            <ServerPerformanceSummary
              durations={transactionsData.data.transactions.map((t) => t.duration)}
              throughput={serverStats.data?.throughput}
              errorRate={serverStats.data?.errorRate}
            />
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ApdexGauge data={apdexData.data} isLoading={apdexData.isLoading} />
            <SpanBreakdownOverview
              data={spanAnalysis.data?.byOp ?? []}
              isLoading={spanAnalysis.isLoading}
            />
          </div>
        </>
      )}

      {/* Client-side summary */}
      {!isServerSide && (
        <>
          <WebVitalsCards vitals={webVitals.data || []} />
          {(!webVitals.data || webVitals.data.length === 0) &&
            transactionsData.data &&
            transactionsData.data.transactions.length > 0 && (
              <ServerPerformanceSummary
                durations={transactionsData.data.transactions.map((t) => t.duration)}
              />
            )}
        </>
      )}

      {/* Quick navigation to sub-pages */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {subPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  {page.title}
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{page.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
