"use client"

import * as React from "react"
import { formatDistanceToNow, isValid } from "date-fns"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LayersIcon,
  AlertTriangleIcon,
  ClockIcon,
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/server/api/types/performance"

export interface GroupedTransaction {
  name: string
  op: string
  count: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  latestTimestamp: Date | string
  statuses: Record<string, number>
  transactions: Transaction[]
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

function formatDateSafe(date: Date | string | null | undefined): string {
  if (!date) return "-"
  try {
    const d = date instanceof Date ? date : new Date(date)
    if (!isValid(d)) return "-"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "-"
  }
}

function parsePerformanceIssues(tags: string | null): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags) as Record<string, unknown>
    const issues = parsed["performance.issues"]
    if (typeof issues === "string") return issues.split(",").map((s) => s.trim())
    if (Array.isArray(issues)) return issues as string[]
  } catch {
    // ignore
  }
  return []
}

const statusColors: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-muted text-muted-foreground",
}

export function groupTransactions(transactions: Transaction[]): GroupedTransaction[] {
  const groups = new Map<string, GroupedTransaction>()

  for (const t of transactions) {
    const key = `${t.name}|${t.op}`
    const existing = groups.get(key)

    if (existing) {
      existing.count++
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + t.duration) / existing.count
      existing.minDuration = Math.min(existing.minDuration, t.duration)
      existing.maxDuration = Math.max(existing.maxDuration, t.duration)
      try {
        const newDate = new Date(t.startTimestamp)
        const existingDate = new Date(existing.latestTimestamp)
        if (isValid(newDate) && isValid(existingDate) && newDate > existingDate) {
          existing.latestTimestamp = t.startTimestamp
        }
      } catch {
        // ignore
      }
      const status = t.status || "ok"
      existing.statuses[status] = (existing.statuses[status] || 0) + 1
      existing.transactions.push(t)
    } else {
      groups.set(key, {
        name: t.name,
        op: t.op,
        count: 1,
        avgDuration: t.duration,
        minDuration: t.duration,
        maxDuration: t.duration,
        latestTimestamp: t.startTimestamp,
        statuses: { [t.status || "ok"]: 1 },
        transactions: [t],
      })
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count)
}

export function createTransactionsColumns(): ColumnDef<Transaction>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-left"
        >
          Transaction
          {column.getIsSorted() === "asc" && (
            <ChevronUpIcon className="ml-2 size-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <ChevronDownIcon className="ml-2 size-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const t = row.original
        const issues = parsePerformanceIssues(t.tags)
        const hasN1 = issues.includes("n_plus_one")
        const hasSlow = issues.includes("slow_query")

        return (
          <div className="flex items-center gap-2">
            <span className="max-w-[250px] truncate font-medium" title={t.name}>
              {t.name}
            </span>
            {hasN1 && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
                N+1
              </Badge>
            )}
            {hasSlow && (
              <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                Slow
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "op",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0"
        >
          Op
          {column.getIsSorted() === "asc" && (
            <ChevronUpIcon className="ml-2 size-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <ChevronDownIcon className="ml-2 size-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {row.original.op}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "ok"
        return (
          <Badge
            variant="outline"
            className={statusColors[status] || statusColors.ok}
          >
            {status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.status === value
      },
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Duration
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {formatDuration(row.original.duration)}
        </div>
      ),
    },
    {
      accessorKey: "startTimestamp",
      header: ({ column }) => (
        <div className="hidden text-right lg:block">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Started
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="hidden items-center justify-end gap-1.5 text-xs text-muted-foreground lg:flex">
          <ClockIcon className="size-3" />
          <span>{formatDateSafe(row.original.startTimestamp)}</span>
        </div>
      ),
    },
  ]
}

export function createGroupedTransactionsColumns(): ColumnDef<GroupedTransaction>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-left"
        >
          Transaction
          {column.getIsSorted() === "asc" && (
            <ChevronUpIcon className="ml-2 size-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <ChevronDownIcon className="ml-2 size-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const g = row.original
        const allIssues = (g.transactions ?? []).flatMap((t) => parsePerformanceIssues(t.tags))
        const hasN1 = allIssues.includes("n_plus_one")
        const hasSlow = allIssues.includes("slow_query")

        return (
          <div className="flex items-center gap-2">
            <LayersIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="max-w-[200px] truncate font-medium" title={g.name}>
              {g.name}
            </span>
            {g.count > 1 && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                x{g.count}
              </span>
            )}
            {hasN1 && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
                N+1
              </Badge>
            )}
            {hasSlow && (
              <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                Slow
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "op",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0"
        >
          Op
          {column.getIsSorted() === "asc" && (
            <ChevronUpIcon className="ml-2 size-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <ChevronDownIcon className="ml-2 size-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {row.original.op}
        </span>
      ),
    },
    {
      accessorKey: "count",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Count
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {row.original.count}
        </div>
      ),
    },
    {
      accessorKey: "avgDuration",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Avg
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {formatDuration(row.original.avgDuration)}
        </div>
      ),
    },
    {
      accessorKey: "minDuration",
      header: () => <div className="hidden text-right lg:block">Min</div>,
      cell: ({ row }) => (
        <div className="hidden text-right font-mono text-sm text-muted-foreground lg:block">
          {formatDuration(row.original.minDuration)}
        </div>
      ),
    },
    {
      accessorKey: "maxDuration",
      header: () => <div className="hidden text-right lg:block">Max</div>,
      cell: ({ row }) => (
        <div className="hidden text-right font-mono text-sm text-muted-foreground lg:block">
          {formatDuration(row.original.maxDuration)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statuses = row.original.statuses ?? { ok: 1 }
        const dominantStatus = Object.entries(statuses).sort((a, b) => b[1] - a[1])[0]?.[0] || "ok"
        const hasErrors = Object.entries(statuses).some(([s, c]) => s !== "ok" && c > 0)

        return (
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={statusColors[dominantStatus] || statusColors.ok}
            >
              {dominantStatus}
            </Badge>
            {hasErrors && dominantStatus === "ok" && (
              <AlertTriangleIcon className="size-3 text-amber-500" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "latestTimestamp",
      header: ({ column }) => (
        <div className="hidden text-right lg:block">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Latest
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="hidden items-center justify-end gap-1.5 text-xs text-muted-foreground lg:flex">
          <ClockIcon className="size-3" />
          <span>{formatDateSafe(row.original.latestTimestamp)}</span>
        </div>
      ),
    },
  ]
}
