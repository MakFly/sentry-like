"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { EndpointImpact } from "@/components/performance/EndpointImpact";
import { TransactionsDataTable, SlowestTable } from "@/components/performance/TransactionsDataTable";
import { ThroughputChart } from "@/components/performance/ThroughputChart";
import { DurationChart } from "@/components/performance/DurationChart";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PerformanceDateRange } from "@/server/api/types";

type TabValue = "endpoints" | "transactions" | "slowest";

export default function RequestsPage() {
  const t = useTranslations("performance");
  const tHeader = useTranslations("pageHeader.performanceRequests");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;
  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;

  const tabParam = searchParams.get("tab") as TabValue | null;
  const initialTab: TabValue =
    tabParam === "transactions" || tabParam === "slowest" || tabParam === "endpoints"
      ? tabParam
      : "endpoints";

  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();
  const [dateRange, setDateRange] = useState<PerformanceDateRange>("24h");
  const [tab, setTab] = useState<TabValue>(initialTab);

  const handleTabChange = (next: string) => {
    const value = next as TabValue;
    setTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "endpoints") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const { data: topEndpoints, isLoading: topEndpointsLoading } =
    trpc.performance.getTopEndpoints.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  const { data: transactionsData, isLoading: transactionsLoading } =
    trpc.performance.getTransactions.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId && (tab === "transactions" || !!searchParams.get("traceId")) }
    );

  const { data: slowest, isLoading: slowestLoading } =
    trpc.performance.getSlowest.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId && tab === "slowest" }
    );

  const { data: throughputData, isLoading: throughputLoading } =
    trpc.performance.getThroughputTimeline.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  const { data: durationData, isLoading: durationLoading } =
    trpc.performance.getDurationTimeline.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  if (projectLoading) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={tHeader("title")}
        description={tHeader("description")}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ThroughputChart
          data={throughputData ?? []}
          isLoading={throughputLoading}
          dateRange={dateRange}
        />
        <DurationChart
          data={durationData ?? []}
          isLoading={durationLoading}
          dateRange={dateRange}
        />
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="endpoints">{t("requests.tabEndpoints")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("transactions.tabAll")}</TabsTrigger>
          <TabsTrigger value="slowest">{t("transactions.tabSlowest")}</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="mt-4">
          <EndpointImpact
            data={topEndpoints}
            isLoading={topEndpointsLoading}
            baseUrl={baseUrl}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsDataTable
            transactions={transactionsData?.transactions || []}
            pagination={transactionsData?.pagination}
            baseUrl={baseUrl}
            isLoading={transactionsLoading}
          />
        </TabsContent>

        <TabsContent value="slowest" className="mt-4">
          <SlowestTable
            transactions={slowest || []}
            isLoading={slowestLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
