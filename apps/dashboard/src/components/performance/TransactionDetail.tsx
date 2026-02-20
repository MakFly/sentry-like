"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TransactionWithSpans, Span } from "@/server/api/types";

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

function SpanBar({ span, totalDuration, transactionStart }: {
  span: Span;
  totalDuration: number;
  transactionStart: number;
}) {
  const spanStart = new Date(span.startTimestamp).getTime();
  const offsetMs = spanStart - transactionStart;
  const leftPercent = totalDuration > 0 ? (offsetMs / totalDuration) * 100 : 0;
  const widthPercent = totalDuration > 0
    ? Math.max((span.duration / totalDuration) * 100, 0.5)
    : 100;

  const barColor = span.status === "error"
    ? "bg-red-500"
    : span.status === "cancelled"
      ? "bg-muted-foreground"
      : "bg-violet-500";

  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <div className="w-[140px] shrink-0 truncate text-xs text-muted-foreground font-mono">
        {span.op}
      </div>
      <div className="flex-1 relative h-6 rounded bg-muted/30">
        <div
          className={`absolute h-full rounded ${barColor} opacity-80`}
          style={{
            left: `${Math.min(leftPercent, 99)}%`,
            width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
          }}
        />
        <div
          className="absolute h-full flex items-center px-1"
          style={{ left: `${Math.min(leftPercent, 99)}%` }}
        >
          <span className="text-[10px] font-mono text-foreground whitespace-nowrap ml-1">
            {formatDuration(span.duration)}
          </span>
        </div>
      </div>
      <div className="w-[180px] shrink-0 truncate text-xs text-muted-foreground">
        {span.description || "—"}
      </div>
    </div>
  );
}

function SpanBreakdown({ spans, totalDuration }: { spans: Span[]; totalDuration: number }) {
  const groups = spans.reduce<Record<string, { count: number; totalMs: number }>>((acc, span) => {
    if (!acc[span.op]) acc[span.op] = { count: 0, totalMs: 0 };
    acc[span.op].count += 1;
    acc[span.op].totalMs += span.duration;
    return acc;
  }, {});

  const sorted = Object.entries(groups).sort((a, b) => b[1].totalMs - a[1].totalMs);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map(([op, { count, totalMs }]) => {
            const pct = totalDuration > 0 ? (totalMs / totalDuration) * 100 : 0;
            return (
              <div key={op} className="flex items-center gap-3">
                <span className="w-[140px] shrink-0 truncate font-mono text-xs text-muted-foreground">
                  {op}
                </span>
                <div className="flex-1 relative h-5 rounded bg-muted/30">
                  <div
                    className="absolute h-full rounded bg-violet-500/60"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="w-[60px] shrink-0 text-right text-xs font-mono">
                  {formatDuration(totalMs)}
                </span>
                <span className="w-[40px] shrink-0 text-right text-xs text-muted-foreground">
                  {pct.toFixed(0)}%
                </span>
                <span className="w-[30px] shrink-0 text-right text-xs text-muted-foreground">
                  {count}x
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionDetailProps {
  transaction: TransactionWithSpans;
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
  const transactionStart = new Date(transaction.startTimestamp).getTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{transaction.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(transaction.startTimestamp)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={statusColors[transaction.status || "ok"] || statusColors.ok}
            >
              {transaction.status || "ok"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium font-mono">
                {formatDuration(transaction.duration)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operation</p>
              <p className="text-sm font-medium">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {transaction.op}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Environment</p>
              <p className="text-sm font-medium">{transaction.env}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spans</p>
              <p className="text-sm font-medium">{transaction.spans.length}</p>
            </div>
          </div>
          {transaction.traceId && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Trace ID</p>
              <p className="text-xs font-mono text-muted-foreground">
                {transaction.traceId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown by operation */}
      {transaction.spans.length > 0 && (
        <SpanBreakdown spans={transaction.spans} totalDuration={transaction.duration} />
      )}

      {/* Waterfall */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Span Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          {transaction.spans.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No spans recorded for this transaction.
            </p>
          ) : (
            <div className="space-y-0.5">
              {transaction.spans.map((span) => (
                <SpanBar
                  key={span.id}
                  span={span}
                  totalDuration={transaction.duration}
                  transactionStart={transactionStart}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
