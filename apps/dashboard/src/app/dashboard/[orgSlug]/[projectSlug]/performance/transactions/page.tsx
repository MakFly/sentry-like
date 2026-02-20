"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { TransactionsDataTable, SlowestTable } from "@/components/performance/TransactionsDataTable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PerformanceDateRange } from "@/server/api/types";

export default function TransactionsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;
  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;

  const { currentProjectId, isLoading: projectLoading } = useCurrentProject();
  const [dateRange, setDateRange] = useState<PerformanceDateRange>("24h");

  const { data: transactionsData, isLoading: transactionsLoading } =
    trpc.performance.getTransactions.useQuery(
      {
        projectId: currentProjectId!,
      },
      { enabled: !!currentProjectId }
    );

  const { data: slowest, isLoading: slowestLoading } =
    trpc.performance.getSlowest.useQuery(
      { projectId: currentProjectId!, dateRange },
      { enabled: !!currentProjectId }
    );

  if (projectLoading) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`${baseUrl}/performance`}>Performance</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Transactions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
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

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="slowest">Slowest</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
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
