"use client";

import { useState, useMemo, useCallback } from "react";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useGroups, useBatchUpdateStatus, useMergeGroups, useSnoozeGroup } from "@/lib/trpc/hooks";
import {
  IssuesHeader,
  SeverityDistributionBar,
  FiltersRow,
  ErrorState,
} from "@/components/issues";
import { DataTable } from "@/components/ui/data-table";
import { createIssuesColumns } from "@/components/issues/issues-data-table-columns";
import type { ErrorLevel } from "@/server/api";
import type { RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

interface FiltersState {
  env: string;
  dateRange: DateRange;
  search: string;
  status: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useState<ReturnType<typeof setTimeout> | null>(null);

  if (value !== debouncedValue) {
    if (timeoutRef[0]) clearTimeout(timeoutRef[0]);
    timeoutRef[1](setTimeout(() => setDebouncedValue(value), delay));
  }

  return debouncedValue;
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const debouncedSearch = useDebounce(filters.search, 300);

  const batchUpdate = useBatchUpdateStatus();
  const mergeGroups = useMergeGroups();
  const snoozeGroup = useSnoozeGroup();

  // Pass filters to server
  const { data: groupsData, isLoading, error, refetch } = useGroups({
    env: filters.env === "all" ? undefined : filters.env,
    dateRange: filters.dateRange === "all" ? undefined : filters.dateRange,
    projectId: currentProjectId || undefined,
    search: debouncedSearch || undefined,
    status: filters.status === "all" ? undefined : filters.status as any,
    level: levelFilter === "all" ? undefined : levelFilter,
  });

  // Handle both old format (array) and new format ({ groups, total, ... })
  const groups = useMemo(() => {
    if (!groupsData) return [];
    if (Array.isArray(groupsData)) return groupsData;
    return (groupsData as any).groups || [];
  }, [groupsData]);

  const totalSignals = useMemo(() => {
    if (!groupsData) return 0;
    if (Array.isArray(groupsData)) return groupsData.length;
    return (groupsData as any).total || 0;
  }, [groupsData]);

  const hasActiveFilters =
    filters.env !== "all" ||
    filters.dateRange !== "all" ||
    filters.search !== "" ||
    filters.status !== "all" ||
    levelFilter !== "all";

  const severityStats = useMemo(() => {
    if (!groups) return { fatal: 0, error: 0, warning: 0, info: 0, debug: 0 };

    return {
      fatal: groups.filter((g: any) => g.level === "fatal").length,
      error: groups.filter((g: any) => g.level === "error").length,
      warning: groups.filter((g: any) => g.level === "warning").length,
      info: groups.filter((g: any) => g.level === "info").length,
      debug: groups.filter((g: any) => g.level === "debug").length,
    };
  }, [groups]);

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
    if (!groups.length) return 0;
    return Math.max(...groups.map((g: any) => g.count));
  }, [groups]);

  const selectedFingerprints = useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  const handleBulkAction = useCallback(
    async (status: "open" | "resolved" | "ignored") => {
      if (selectedFingerprints.length === 0) return;
      try {
        await batchUpdate.mutateAsync({ fingerprints: selectedFingerprints, status });
        toast.success(`${selectedFingerprints.length} issue(s) updated to ${status}`);
        setRowSelection({});
        refetch();
      } catch {
        toast.error("Failed to update issues");
      }
    },
    [selectedFingerprints, batchUpdate, refetch]
  );

  const handleMerge = useCallback(async () => {
    if (selectedFingerprints.length < 2) return;
    try {
      const [parent, ...children] = selectedFingerprints;
      await mergeGroups.mutateAsync({ parentFingerprint: parent, childFingerprints: children });
      toast.success(`Merged ${children.length} issue(s) into 1`);
      setRowSelection({});
      refetch();
    } catch {
      toast.error("Failed to merge issues");
    }
  }, [selectedFingerprints, mergeGroups, refetch]);

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

      {/* Bulk action toolbar */}
      {selectedFingerprints.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selectedFingerprints.length} selected</span>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => handleBulkAction("resolved")}
            className="text-green-600 hover:underline"
            disabled={batchUpdate.isPending}
          >
            Resolve
          </button>
          <button
            onClick={() => handleBulkAction("ignored")}
            className="text-yellow-600 hover:underline"
            disabled={batchUpdate.isPending}
          >
            Ignore
          </button>
          <button
            onClick={() => handleBulkAction("open")}
            className="text-blue-600 hover:underline"
            disabled={batchUpdate.isPending}
          >
            Reopen
          </button>
          {selectedFingerprints.length >= 2 && (
            <button
              onClick={handleMerge}
              className="text-purple-600 hover:underline"
              disabled={mergeGroups.isPending}
            >
              Merge
            </button>
          )}
        </div>
      )}

      <DataTable
        data={groups}
        columns={columns}
        isLoading={isLoading}
        showSearch={false}
        showColumnToggle
        enableRowSelection
        pageSize={15}
        className="w-full"
        getRowId={(group: any) => group.fingerprint}
        onRowSelectionChange={setRowSelection}
        rowSelection={rowSelection}
        emptyMessage={
          hasActiveFilters
            ? "No matching signals found. Try adjusting your filters."
            : "No signals detected. Your application is running smoothly."
        }
      />
    </div>
  );
}
