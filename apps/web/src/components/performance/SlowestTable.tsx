"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SlowestTransaction } from "@/server/api/types";

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

interface SlowestTableProps {
  transactions: SlowestTransaction[];
}

export function SlowestTable({ transactions }: SlowestTableProps) {
  const t = useTranslations("performance");

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("slowestTransactions.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{t("transactions.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("slowestTransactions.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("transactions.columns.name")}</TableHead>
              <TableHead>{t("transactions.columns.op")}</TableHead>
              <TableHead className="text-right">{t("transactions.columns.avg")}</TableHead>
              <TableHead className="text-right">{t("transactions.columns.max")}</TableHead>
              <TableHead className="text-right">{t("transactions.columns.count")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn, i) => (
              <TableRow key={`${txn.name}-${txn.op}-${i}`}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {txn.name}
                </TableCell>
                <TableCell>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {txn.op}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatDuration(txn.avgDuration)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatDuration(txn.maxDuration)}
                </TableCell>
                <TableCell className="text-right">{txn.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
