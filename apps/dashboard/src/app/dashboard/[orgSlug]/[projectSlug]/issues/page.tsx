"use client";

import { useState, useMemo } from "react";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useGroups } from "@/lib/trpc/hooks";
import {
  IssuesHeader,
  SeverityDistributionBar,
  FiltersRow,
  ErrorState,
} from "@/components/issues";
import { DataTable } from "@/components/ui/data-table";
import { createIssuesColumns } from "@/components/issues/issues-data-table-columns";
import type { ErrorLevel } from "@/server/api";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

interface FiltersState {
  env: string;
  dateRange: DateRange;
  search: string;
  status: string;
}

export default function IssuesPage() {
  const { currentProjectId, currentProjectSlug } = useCurrentProject();
  const { currentOrgSlug } = useCurrentOrganization();

  const [filters, setFilters] = useState<FiltersState>({
    env: "all",
    dateRange: "all",
    search: "",
    status: "all",
  });
  const [levelFilter, setLevelFilter] = useState<ErrorLevel | "all">("all");

  const { data: groups, isLoading, error, refetch } = useGroups({
    env: filters.env === "all" ? undefined : filters.env,
    dateRange: filters.dateRange === "all" ? undefined : filters.dateRange,
    projectId: currentProjectId || undefined,
  });

  const hasActiveFilters =
    filters.env !== "all" ||
    filters.dateRange !== "all" ||
    filters.search !== "" ||
    filters.status !== "all" ||
    levelFilter !== "all";

  const filteredGroups = useMemo(() => {
    if (!groups) return [];

    let result = groups;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (g) =>
          g.message.toLowerCase().includes(search) ||
          g.file.toLowerCase().includes(search)
      );
    }

    if (levelFilter !== "all") {
      result = result.filter((g) => g.level === levelFilter);
    }

    if (filters.status !== "all") {
      result = result.filter((g) => g.status === filters.status);
    }

    return result;
  }, [groups, filters.search, levelFilter, filters.status]);

  const severityStats = useMemo(() => {
    if (!groups) return { fatal: 0, error: 0, warning: 0, info: 0, debug: 0 };

    let filtered = groups;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.message.toLowerCase().includes(search) ||
          g.file.toLowerCase().includes(search)
      );
    }

    return {
      fatal: filtered.filter((g) => g.level === "fatal").length,
      error: filtered.filter((g) => g.level === "error").length,
      warning: filtered.filter((g) => g.level === "warning").length,
      info: filtered.filter((g) => g.level === "info").length,
      debug: filtered.filter((g) => g.level === "debug").length,
    };
  }, [groups, filters.search]);

  const totalSignals = groups?.length || 0;

  const handleClearFilters = () => {
    setFilters({
      env: "all",
      dateRange: "all",
      search: "",
      status: "all",
    });
    setLevelFilter("all");
  };

  const maxCount = useMemo(() => {
    if (!filteredGroups.length) return 0
    return Math.max(...filteredGroups.map((g) => g.count))
  }, [filteredGroups])

  const columns = useMemo(
    () => createIssuesColumns({ orgSlug: currentOrgSlug || "", projectSlug: currentProjectSlug || "", maxCount, onStatusChange: refetch }),
    [currentOrgSlug, currentProjectSlug, maxCount, refetch]
  );

  if (error) {
    return (
      <div className="min-h-screen bg-issues-bg p-4 md:p-6">
        <IssuesHeader totalSignals={0} />
        <ErrorState message={error.message} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6">
      <IssuesHeader totalSignals={totalSignals} isLoading={isLoading} />

      <SeverityDistributionBar
        stats={severityStats}
        activeFilter={levelFilter}
        onFilterChange={setLevelFilter}
        isLoading={isLoading}
        className="mb-6"
      />

      <FiltersRow
        search={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        environment={filters.env}
        onEnvironmentChange={(value) => setFilters({ ...filters, env: value })}
        dateRange={filters.dateRange}
        onDateRangeChange={(value) =>
          setFilters({ ...filters, dateRange: value })
        }
        status={filters.status}
        onStatusChange={(value) => setFilters({ ...filters, status: value })}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        className="mb-6"
      />

      <DataTable
        data={filteredGroups}
        columns={columns}
        isLoading={isLoading}
        showSearch={false}
        showColumnToggle
        enableRowSelection
        pageSize={15}
        className="w-full"
        getRowId={(group) => group.fingerprint}
        emptyMessage={
          hasActiveFilters
            ? "No matching signals found. Try adjusting your filters."
            : "No signals detected. Your application is running smoothly."
        }
      />
    </div>
  );
}
