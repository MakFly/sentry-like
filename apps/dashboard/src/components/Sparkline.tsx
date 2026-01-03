"use client";

import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

export default function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#a78bfa",
  fillOpacity = 0.2,
  className = "",
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length === 0) return "";

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      // Handle single data point case to avoid division by zero
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return "";
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="h-px w-full bg-border" />
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#gradient-${color.replace("#", "")})`}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Generate fake sparkline data based on count (for demo)
export function generateSparklineData(count: number, days: number = 14): number[] {
  const baseValue = Math.max(1, Math.floor(count / days));
  return Array.from({ length: days }, (_, i) => {
    const noise = Math.random() * baseValue * 0.5;
    const trend = (i / days) * baseValue * 0.3;
    return Math.max(0, Math.floor(baseValue + noise + trend));
  });
}
