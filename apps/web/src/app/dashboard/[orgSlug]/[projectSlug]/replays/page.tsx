"use client";

import { useState, useMemo } from "react";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useReplaySessions, type ReplaySessionsFilters } from "@/lib/trpc/hooks";
import {
  ReplaysHeader,
  DeviceDistributionBar,
  ReplaysFiltersRow,
  createReplaysColumns,
} from "@/components/replays";
import { DataTable } from "@/components/ui/data-table";
import type { DeviceType, ErrorLevel } from "@/server/api";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

interface FiltersState {
  search: string;
  browser: string;
  os: string;
  dateRange: DateRange;
  severity: string;
}

function getDateFromRange(range: DateRange): string | undefined {
  if (range === "all") return undefined;

  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

export default function ReplaysPage() {
  const { currentProjectId, currentProjectSlug } = useCurrentProject();
  const { currentOrgSlug } = useCurrentOrganization();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    browser: "all",
    os: "all",
    dateRange: "all",
    severity: "all",
  });
  const [deviceFilter, setDeviceFilter] = useState<DeviceType | "all">("all");

  // Convert filter state to API format
  const apiFilters = useMemo((): ReplaySessionsFilters => {
    const result: ReplaySessionsFilters = {};

    if (deviceFilter !== "all") {
      result.deviceType = deviceFilter;
    }
    if (filters.browser !== "all") {
      result.browser = filters.browser;
    }
    if (filters.os !== "all") {
      result.os = filters.os;
    }
    if (filters.severity !== "all") {
      result.severity = filters.severity as ErrorLevel;
    }

    const dateFrom = getDateFromRange(filters.dateRange);
    if (dateFrom) {
      result.dateFrom = dateFrom;
    }

    return result;
  }, [filters, deviceFilter]);

  const { data, isLoading, error } = useReplaySessions(apiFilters, page, currentProjectId || undefined);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.browser !== "all" ||
    filters.os !== "all" ||
    filters.dateRange !== "all" ||
    filters.severity !== "all" ||
    deviceFilter !== "all";

  // Client-side search filtering (URL search)
  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];

    if (!filters.search) return data.sessions;

    const search = filters.search.toLowerCase();
    return data.sessions.filter(
      (s) => s.url?.toLowerCase().includes(search)
    );
  }, [data?.sessions, filters.search]);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      browser: "all",
      os: "all",
      dateRange: "all",
      severity: "all",
    });
    setDeviceFilter("all");
    setPage(1);
  };

  const columns = useMemo(
    () => createReplaysColumns({ orgSlug: currentOrgSlug || "", projectSlug: currentProjectSlug || "" }),
    [currentOrgSlug, currentProjectSlug]
  );

  const totalSessions = data?.pagination?.total || 0;
  const deviceStats = data?.stats || { desktop: 0, mobile: 0, tablet: 0, totalErrors: 0 };

  if (error) {
    return (
      <div className="min-h-screen bg-issues-bg p-4 md:p-6">
        <ReplaysHeader totalSessions={0} />
        <div className="mt-8 text-center py-12">
          <p className="text-destructive">Failed to load replays</p>
          <p className="text-muted-foreground text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6">
      <ReplaysHeader totalSessions={totalSessions} isLoading={isLoading} />

      <DeviceDistributionBar
        stats={deviceStats}
        activeFilter={deviceFilter}
        onFilterChange={(device) => {
          setDeviceFilter(device);
          setPage(1);
        }}
        isLoading={isLoading}
        className="mb-6"
      />

      <ReplaysFiltersRow
        search={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        browser={filters.browser}
        onBrowserChange={(value) => {
          setFilters({ ...filters, browser: value });
          setPage(1);
        }}
        os={filters.os}
        onOsChange={(value) => {
          setFilters({ ...filters, os: value });
          setPage(1);
        }}
        dateRange={filters.dateRange}
        onDateRangeChange={(value) => {
          setFilters({ ...filters, dateRange: value });
          setPage(1);
        }}
        severity={filters.severity}
        onSeverityChange={(value) => {
          setFilters({ ...filters, severity: value });
          setPage(1);
        }}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        className="mb-6"
      />

      <DataTable
        data={filteredSessions}
        columns={columns}
        isLoading={isLoading}
        showSearch={false}
        showColumnToggle
        enableRowSelection={false}
        pageSize={8}
        className="w-full"
        getRowId={(session) => session.id}
        emptyMessage={
          hasActiveFilters
            ? "No matching sessions found. Try adjusting your filters."
            : "No session replays recorded yet."
        }
      />
    </div>
  );
}
