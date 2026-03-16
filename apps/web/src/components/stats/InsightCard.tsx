"use client";

import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Shield,
  AlertTriangle,
} from "lucide-react";

type InsightIcon =
  | "trending-up"
  | "trending-down"
  | "clock"
  | "calendar"
  | "shield"
  | "alert-triangle";

type Sentiment = "positive" | "negative" | "neutral";

interface InsightCardProps {
  icon: InsightIcon;
  title: string;
  message: string;
  value?: string;
  sentiment: Sentiment;
  className?: string;
}

const iconMap = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  clock: Clock,
  calendar: Calendar,
  shield: Shield,
  "alert-triangle": AlertTriangle,
};

const sentimentStyles: Record<Sentiment, { bg: string; border: string; icon: string }> = {
  positive: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
  },
  negative: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-500",
  },
  neutral: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: "text-primary",
  },
};

export function InsightCard({
  icon,
  title,
  message,
  value,
  sentiment,
  className,
}: InsightCardProps) {
  const Icon = iconMap[icon];
  const styles = sentimentStyles[sentiment];

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        styles.bg,
        styles.border,
        "hover:shadow-lg hover:shadow-black/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            styles.bg
          )}
        >
          <Icon className={cn("h-4 w-4", styles.icon)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            {value && (
              <span
                className={cn(
                  "shrink-0 font-mono text-sm font-semibold",
                  styles.icon
                )}
              >
                {value}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
