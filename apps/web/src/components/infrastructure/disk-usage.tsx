"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

type DiskInfo = {
  device: string;
  mountpoint: string;
  total: number;
  used: number;
  usedPercent: number;
};

const GB = 1024 * 1024 * 1024;

export function DiskUsage({ disks }: { disks: DiskInfo[] | null }) {
  const t = useTranslations("infrastructure");

  const chartData = useMemo(() => {
    if (!disks) return [];
    return disks.map((d) => ({
      name: d.mountpoint,
      used: d.used / GB,
      free: (d.total - d.used) / GB,
      usedPercent: d.usedPercent,
    }));
  }, [disks]);

  if (!disks || disks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("diskUsage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No disk data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("diskUsage")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={Math.max(150, chartData.length * 50)}
        >
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)} GB`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} GB`]}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="used"
              stackId="a"
              fill="hsl(var(--chart-1))"
              radius={[0, 0, 0, 0]}
              name={t("memoryUsed")}
            />
            <Bar
              dataKey="free"
              stackId="a"
              fill="hsl(var(--muted))"
              radius={[0, 4, 4, 0]}
              name={t("memoryAvailable")}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
