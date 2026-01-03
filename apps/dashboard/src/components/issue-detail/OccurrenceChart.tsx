"use client";

import { cn } from "@/lib/utils";
import { Activity, Calendar, Clock, Users } from "lucide-react";

interface OccurrenceChartProps {
  count: number;
  firstSeen: Date | string;
  lastSeen: Date | string;
  users?: number;
  timeline: Array<{ date: string; count: number }>;
  className?: string;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const width = 100;
  const height = 32;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  // Create fill area
  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full h-8", className)}>
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--pulse-primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--pulse-primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill="url(#sparkline-gradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--pulse-primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OccurrenceChart({
  count,
  firstSeen,
  lastSeen,
  users,
  timeline,
  className,
}: OccurrenceChartProps) {
  const sparklineData = timeline.map(t => t.count);

  return (
    <div className={cn(
      "rounded-xl border border-issues-border bg-issues-surface overflow-hidden",
      className
    )}>
      <div className="p-4 md:p-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4">
          {/* Occurrences */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Occurrences</span>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground tabular-nums">
              {count.toLocaleString()}
            </p>
          </div>

          {/* First seen */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">First seen</span>
            </div>
            <p className="font-mono text-sm text-foreground">
              {formatDate(firstSeen)}
            </p>
          </div>

          {/* Last seen */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Last seen</span>
            </div>
            <p className="font-mono text-sm text-foreground">
              {formatTimeAgo(lastSeen)}
            </p>
          </div>

          {/* Users affected */}
          {users !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Users</span>
              </div>
              <p className="font-mono text-sm text-foreground">
                {users.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Sparkline */}
        <div className="pt-2 border-t border-issues-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Last 30 days
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {sparklineData.reduce((a, b) => a + b, 0).toLocaleString()} events
            </span>
          </div>
          <Sparkline data={sparklineData} />
        </div>
      </div>
    </div>
  );
}
