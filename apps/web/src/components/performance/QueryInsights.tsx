"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DuplicateQuery, SlowQuery } from "@/server/api/types/performance";

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

function duplicateBadgeVariant(count: number): "destructive" | "secondary" {
  if (count >= 20) return "destructive";
  return "secondary";
}

function duplicateBadgeClass(count: number): string {
  if (count >= 20) return "";
  if (count >= 10) return "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25";
  return "";
}

interface QueryInsightsProps {
  duplicateQueries: DuplicateQuery[];
  slowQueries: SlowQuery[];
  isLoading: boolean;
  baseUrl?: string;
}

export function QueryInsights({ duplicateQueries, slowQueries, isLoading, baseUrl }: QueryInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Query Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (duplicateQueries.length === 0 && slowQueries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Query Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duplicate Queries */}
        {duplicateQueries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Duplicate Queries (potential N+1)
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Query</TableHead>
                  <TableHead className="w-[80px] text-right">Count</TableHead>
                  <TableHead className="w-[100px] text-right">Total Time</TableHead>
                  <TableHead className="w-[80px] text-right">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicateQueries.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs truncate" title={q.description}>
                      {q.description}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                      {q.count}x
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                      {formatDuration(q.totalDuration)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={duplicateBadgeVariant(q.count)}
                        className={duplicateBadgeClass(q.count)}
                      >
                        {q.count >= 20 ? "Critical" : q.count >= 10 ? "Warning" : "Info"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {duplicateQueries.length > 0 && slowQueries.length > 0 && <Separator />}

        {/* Slowest Queries */}
        {slowQueries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Slowest Queries
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Query</TableHead>
                  <TableHead className="w-[100px] text-right">Duration</TableHead>
                  <TableHead className="w-[30%]">Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowQueries.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs truncate" title={q.description}>
                      {q.description}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                      {formatDuration(q.duration)}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      {baseUrl ? (
                        <Link
                          href={`${baseUrl}/performance/transactions/${q.transactionId}`}
                          className="text-primary hover:underline"
                        >
                          {q.transactionName}
                        </Link>
                      ) : (
                        q.transactionName
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
