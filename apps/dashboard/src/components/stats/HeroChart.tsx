"use client";

import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TimelinePoint, TimelineRange } from "@/server/api";

interface HeroChartProps {
  data: TimelinePoint[];
  range: TimelineRange;
  className?: string;
}

const chartConfig = {
  events: {
    label: "Events",
    color: "hsl(var(--primary))",
  },
  groups: {
    label: "New Groups",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function HeroChart({ data, range, className }: HeroChartProps) {
  const formatDate = (date: string) => {
    if (range === "24h") {
      return date.slice(11, 16);
    }
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate totals
  const totalEvents = data.reduce((sum, p) => sum + p.events, 0);
  const totalGroups = data.reduce((sum, p) => sum + p.groups, 0);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 lg:p-8",
        className
      )}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Events Over Time
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Error frequency in the last{" "}
            {range === "24h" ? "24 hours" : range === "7d" ? "7 days" : "30 days"}
          </p>
        </div>

        {/* Totals */}
        <div className="flex gap-6">
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-primary">
              {totalEvents.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-muted-foreground">
              {totalGroups.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">New Groups</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="fillGroups" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (range === "24h") return `Time: ${value}`;
                      return new Date(value).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#fillEvents)"
              />
              <Area
                type="monotone"
                dataKey="groups"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#fillGroups)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="flex h-[350px] items-center justify-center text-muted-foreground">
          No data available for this period
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
          <span className="text-sm text-muted-foreground">New Groups</span>
        </div>
      </div>
    </div>
  );
}
