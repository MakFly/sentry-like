import {
  AlertTriangle,
  Zap,
  Activity,
  CircleDot,
  Bug,
} from "lucide-react";
import type { ErrorLevel } from "@/server/api";
import type { LucideIcon } from "lucide-react";

export interface SeverityConfig {
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  dot: string;
  sparklineColor: string;
}

/**
 * Centralized severity configuration for all dashboard components
 * - fatal: Critical errors (5xx, crashes) - Rose/Pink
 * - error: Standard errors - Red
 * - warning: Validation/client errors (4xx) - Amber
 * - info: Informational - Sky blue
 * - debug: Debug messages - Gray/Slate
 */
export const SEVERITY_CONFIG: Record<ErrorLevel, SeverityConfig> = {
  fatal: {
    label: "Critical",
    color: "text-rose-400",
    glow: "shadow-[0_0_20px_rgba(251,113,133,0.4)]",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: Zap,
    dot: "bg-rose-500",
    sparklineColor: "#fb7185",
  },
  error: {
    label: "Error",
    color: "text-red-400",
    glow: "shadow-[0_0_12px_rgba(248,113,113,0.3)]",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    icon: AlertTriangle,
    dot: "bg-red-400",
    sparklineColor: "#f87171",
  },
  warning: {
    label: "Warning",
    color: "text-amber-400",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.3)]",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: Activity,
    dot: "bg-amber-400",
    sparklineColor: "#fbbf24",
  },
  info: {
    label: "Info",
    color: "text-sky-400",
    glow: "",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: CircleDot,
    dot: "bg-sky-400",
    sparklineColor: "#38bdf8",
  },
  debug: {
    label: "Debug",
    color: "text-slate-400",
    glow: "",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: Bug,
    dot: "bg-slate-400",
    sparklineColor: "#94a3b8",
  },
};

/**
 * Check if a level is considered critical (fatal or error)
 */
export function isCriticalLevel(level: ErrorLevel): boolean {
  return level === "fatal" || level === "error";
}

/**
 * Get the sparkline color for a given level
 */
export function getSparklineColor(level: ErrorLevel): string {
  return SEVERITY_CONFIG[level].sparklineColor;
}

/**
 * Get the severity config for a given level with fallback
 */
export function getSeverityConfig(level: ErrorLevel | undefined): SeverityConfig {
  return SEVERITY_CONFIG[level ?? "error"];
}
