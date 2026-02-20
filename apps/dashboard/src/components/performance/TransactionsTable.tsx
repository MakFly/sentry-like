"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { Transaction } from "@/server/api/types";

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString();
}

const statusColors: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-muted text-muted-foreground",
};

interface GroupedTransaction {
  name: string;
  op: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  latestTimestamp: Date;
  statuses: Record<string, number>;
  transactions: Transaction[];
}

function parsePerformanceIssues(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags) as Record<string, unknown>;
    const issues = parsed["performance.issues"];
    if (typeof issues === "string") return issues.split(",").map((s) => s.trim());
    if (Array.isArray(issues)) return issues as string[];
  } catch {
    // ignore
  }
  return [];
}

function groupTransactions(transactions: Transaction[]): GroupedTransaction[] {
  const groups = new Map<string, GroupedTransaction>();

  for (const t of transactions) {
    const key = `${t.name}|${t.op}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count++;
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + t.duration) / existing.count;
      existing.minDuration = Math.min(existing.minDuration, t.duration);
      existing.maxDuration = Math.max(existing.maxDuration, t.duration);
      if (new Date(t.startTimestamp) > new Date(existing.latestTimestamp)) {
        existing.latestTimestamp = t.startTimestamp;
      }
      const status = t.status || "ok";
      existing.statuses[status] = (existing.statuses[status] || 0) + 1;
      existing.transactions.push(t);
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
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

interface TransactionsTableProps {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  baseUrl: string;
  onPageChange: (page: number) => void;
}

export function TransactionsTable({
  transactions,
  pagination,
  baseUrl,
  onPageChange,
}: TransactionsTableProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");
  const groupedTransactions = groupTransactions(transactions);

  if (transactions.length === 0 && pagination.page === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </CardContent>
      </Card>
    );
  }

  const hasDuplicates = groupedTransactions.some((g) => g.count > 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Transactions</CardTitle>
        <div className="flex items-center gap-4">
          {hasDuplicates && (
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grouped" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                className="h-7 gap-1"
              >
                <Layers className="h-3 w-3" />
                Grouped
              </Button>
              <Button
                variant={viewMode === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("individual")}
                className="h-7"
              >
                Individual
              </Button>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {pagination.total} total
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grouped" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Op</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Max</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedTransactions.map((g) => {
                const dominantStatus = Object.entries(g.statuses).sort((a, b) => b[1] - a[1])[0]?.[0] || "ok";
                const allIssues = g.transactions.flatMap((t) => parsePerformanceIssues(t.tags));
                const hasN1 = allIssues.includes("n_plus_one");
                const hasSlow = allIssues.includes("slow_query");
                return (
                  <TableRow
                    key={`${g.name}-${g.op}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`${baseUrl}/performance/transactions/${g.transactions[0].id}`)}
                  >
                    <TableCell className="max-w-[250px] truncate font-medium">
                      <span className="hover:underline">{g.name}</span>
                      {g.count > 1 && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          x{g.count}
                        </span>
                      )}
                      {hasN1 && (
                        <Badge variant="outline" className="ml-2 bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
                          N+1
                        </Badge>
                      )}
                      {hasSlow && (
                        <Badge variant="outline" className="ml-1 bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                          Slow
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {g.op}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{g.count}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatDuration(g.avgDuration)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatDuration(g.minDuration)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatDuration(g.maxDuration)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[dominantStatus] || statusColors.ok}
                      >
                        {dominantStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(g.latestTimestamp)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Op</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => {
                const issues = parsePerformanceIssues(t.tags);
                const hasN1 = issues.includes("n_plus_one");
                const hasSlow = issues.includes("slow_query");
                return (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`${baseUrl}/performance/transactions/${t.id}`)}
                >
                  <TableCell className="max-w-[250px] truncate font-medium">
                    <span className="hover:underline">{t.name}</span>
                    {hasN1 && (
                      <Badge variant="outline" className="ml-2 bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
                        N+1
                      </Badge>
                    )}
                    {hasSlow && (
                      <Badge variant="outline" className="ml-1 bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                        Slow
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {t.op}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[t.status || "ok"] || statusColors.ok}
                    >
                      {t.status || "ok"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDuration(t.duration)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(t.startTimestamp)}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
