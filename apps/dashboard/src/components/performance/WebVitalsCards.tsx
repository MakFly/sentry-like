"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WebVitalSummary } from "@/server/api/types";

const vitalLabels: Record<string, { label: string; unit: string; description: string }> = {
  LCP: { label: "Largest Contentful Paint", unit: "ms", description: "Loading performance" },
  FID: { label: "First Input Delay", unit: "ms", description: "Interactivity" },
  CLS: { label: "Cumulative Layout Shift", unit: "", description: "Visual stability" },
  TTFB: { label: "Time to First Byte", unit: "ms", description: "Server response" },
  INP: { label: "Interaction to Next Paint", unit: "ms", description: "Responsiveness" },
};

const statusColors = {
  good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "needs-improvement": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  poor: "bg-red-500/15 text-red-400 border-red-500/30",
};

const statusLabels = {
  good: "Good",
  "needs-improvement": "Needs Improvement",
  poor: "Poor",
};

function formatValue(name: string, value: number): string {
  if (name === "CLS") return (value / 1000).toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${value}ms`;
}

interface WebVitalsCardsProps {
  vitals: WebVitalSummary[];
}

export function WebVitalsCards({ vitals }: WebVitalsCardsProps) {
  const orderedNames = ["LCP", "FID", "CLS", "TTFB", "INP"];
  const orderedVitals = orderedNames.map(
    (name) => vitals.find((v) => v.name === name) || null
  );

  if (vitals.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No Web Vitals data yet. Install the SDK to start collecting metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {orderedVitals.map((vital, i) => {
        const name = orderedNames[i];
        const info = vitalLabels[name];

        if (!vital) {
          return (
            <Card key={name} className="opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="mt-1 text-xs text-muted-foreground">{info?.description}</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {name}
              </CardTitle>
              <Badge variant="outline" className={statusColors[vital.status]}>
                {statusLabels[vital.status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatValue(name, vital.avg)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{info?.description}</p>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span>p50: {formatValue(name, vital.p50)}</span>
                <span>p75: {formatValue(name, vital.p75)}</span>
                <span>p95: {formatValue(name, vital.p95)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {vital.count} sample{vital.count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
