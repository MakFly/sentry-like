"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReplaysHeaderProps {
  totalSessions: number;
  isLoading?: boolean;
  className?: string;
}

export function ReplaysHeader({ totalSessions, isLoading, className }: ReplaysHeaderProps) {
  const t = useTranslations("replays");

  return (
    <div className={cn("mb-6 flex items-start justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Session count badge */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
        <Film className="h-4 w-4 text-primary" />
        {isLoading ? (
          <Skeleton className="h-4 w-8" />
        ) : (
          <span className="font-mono text-sm font-semibold text-primary">
            {totalSessions.toLocaleString()}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{t("sessions")}</span>
      </div>
    </div>
  );
}
