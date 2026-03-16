"use client";

import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface IssuesHeaderProps {
  totalSignals: number;
  isLoading?: boolean;
  className?: string;
}

export function IssuesHeader({ totalSignals, isLoading, className }: IssuesHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-start justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Issues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming signals requiring attention
        </p>
      </div>

      {/* Signal count badge */}
      <div className="flex items-center gap-2 rounded-lg border border-pulse-primary/30 bg-pulse-primary/10 px-3 py-2">
        <Radio className="h-4 w-4 text-pulse-primary" />
        {isLoading ? (
          <Skeleton className="h-4 w-8" />
        ) : (
          <span className="font-mono text-sm font-semibold text-pulse-primary">
            {totalSignals.toLocaleString()}
          </span>
        )}
        <span className="text-xs text-pulse-muted">signals</span>
      </div>
    </div>
  );
}
