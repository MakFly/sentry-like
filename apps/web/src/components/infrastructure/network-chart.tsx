"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";

type NetworkInterface = {
  interface: string;
  bytesSent: number;
  bytesRecv: number;
};

type NetworkDataPoint = {
  timestamp: string;
  networks: NetworkInterface[] | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function NetworkChart({ data }: { data: NetworkDataPoint[] }) {
  const t = useTranslations("infrastructure");

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // The agent already sends byte rates per second, so display directly
    return data.map((point) => {
      let totalRecv = 0;
      let totalSent = 0;

      if (point.networks) {
        for (const net of point.networks) {
          totalRecv += net.bytesRecv ?? 0;
          totalSent += net.bytesSent ?? 0;
        }
      }

      return {
        time: new Date(point.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        received: Math.round(totalRecv),
        sent: Math.round(totalSent),
      };
    });
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {t("networkTraffic")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatBytes}
            />
            <Tooltip
              formatter={(value: number) => [formatBytes(value)]}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="received"
              stroke="hsl(var(--chart-1))"
              dot={false}
              name={t("networkReceived")}
            />
            <Line
              type="monotone"
              dataKey="sent"
              stroke="hsl(var(--chart-2))"
              dot={false}
              name={t("networkSent")}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
