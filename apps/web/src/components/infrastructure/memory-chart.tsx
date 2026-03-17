"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { useMemo } from "react";

type MemoryDataPoint = {
  timestamp: string;
  memory: {
    used: number;
    total: number;
    usedPercent: number;
    swapUsed: number;
  };
};

const GB = 1024 * 1024 * 1024;

export function MemoryChart({ data }: { data: MemoryDataPoint[] }) {
  const t = useTranslations("infrastructure");

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        used: d.memory.used / GB,
        total: d.memory.total / GB,
        swap: d.memory.swapUsed / GB,
      })),
    [data]
  );

  const maxTotal =
    chartData.length > 0
      ? Math.ceil(Math.max(...chartData.map((d) => d.total)))
      : 16;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("memoryUsage")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, maxTotal]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} GB`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)} GB`]}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="used"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.4}
              name={t("memoryUsed")}
            />
            <Line
              type="monotone"
              dataKey="swap"
              stroke="hsl(var(--chart-4))"
              strokeDasharray="5 5"
              dot={false}
              name={t("swap")}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
