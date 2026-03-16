"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("performance.queries.insights");

  function getSeverityLabel(count: number): string {
    if (count >= 20) return t("severity.critical");
    if (count >= 10) return t("severity.warning");
    return t("severity.info");
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
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
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duplicate Queries */}
        {duplicateQueries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t("duplicates")}
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">{t("columns.query")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("columns.count")}</TableHead>
                  <TableHead className="w-[100px] text-right">{t("columns.totalTime")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("columns.severity")}</TableHead>
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
                        {getSeverityLabel(q.count)}
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
              {t("slowest")}
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">{t("columns.query")}</TableHead>
                  <TableHead className="w-[100px] text-right">{t("columns.duration")}</TableHead>
                  <TableHead className="w-[30%]">{t("columns.transaction")}</TableHead>
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
