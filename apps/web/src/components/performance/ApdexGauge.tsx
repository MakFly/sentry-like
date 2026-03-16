"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApdexScore } from "@/server/api/types/performance";

function getApdexColor(score: number): string {
  if (score >= 0.94) return "text-green-400";
  if (score >= 0.85) return "text-green-500";
  if (score >= 0.7) return "text-yellow-500";
  if (score >= 0.5) return "text-orange-500";
  return "text-red-500";
}

function getApdexLabel(score: number): string {
  if (score >= 0.94) return "Excellent";
  if (score >= 0.85) return "Good";
  if (score >= 0.7) return "Fair";
  if (score >= 0.5) return "Poor";
  return "Unacceptable";
}

function getApdexStrokeColor(score: number): string {
  if (score >= 0.94) return "#4ade80";
  if (score >= 0.85) return "#22c55e";
  if (score >= 0.7) return "#eab308";
  if (score >= 0.5) return "#f97316";
  return "#ef4444";
}

interface ApdexGaugeProps {
  data: ApdexScore | undefined;
  isLoading: boolean;
}

export function ApdexGauge({ data, isLoading }: ApdexGaugeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Apdex Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Skeleton className="h-24 w-24 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Apdex Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">No data</p>
        </CardContent>
      </Card>
    );
  }

  const { score, satisfied, tolerating, frustrated, total, threshold } = data;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Apdex Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Gauge */}
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx="50" cy="50" r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="50" cy="50" r="40"
                stroke={getApdexStrokeColor(score)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold font-mono ${getApdexColor(score)}`}>
                {score.toFixed(2)}
              </span>
            </div>
          </div>
          {/* Details */}
          <div className="flex-1 space-y-1.5">
            <p className={`text-sm font-semibold ${getApdexColor(score)}`}>
              {getApdexLabel(score)}
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="text-green-400">Satisfied (&lt;{threshold}ms)</span>
                <span className="font-mono">{satisfied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">Tolerating</span>
                <span className="font-mono">{tolerating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Frustrated</span>
                <span className="font-mono">{frustrated}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span>Total</span>
                <span className="font-mono">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
