"use client";

import Link from "next/link";
import { useGroups } from "@/lib/trpc/hooks";
import Sparkline, { generateSparklineData } from "./Sparkline";
import {
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG, getSparklineColor } from "@/lib/severity-config";

interface FiltersState {
  env?: string;
  dateRange?: "24h" | "7d" | "30d" | "90d" | "all";
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

interface ErrorListProps {
  filters?: FiltersState;
  limit?: number;
  projectSlug: string;
}

export default function ErrorList({ filters = {}, limit, projectSlug }: ErrorListProps) {
  const { data: groups, isLoading, error } = useGroups(filters);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Loading issues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="mt-4 font-medium text-destructive">Failed to load issues</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h3 className="mt-6 text-lg font-semibold">No issues found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything is running smoothly. Keep up the great work!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-card/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Issue
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
              Graph
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Events
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
              Last Seen
            </th>
          </tr>
        </thead>
        <tbody className="stagger-children">
          {(limit ? groups.slice(0, limit) : groups).map((group, index) => {
            const level = group.level;
            const config = SEVERITY_CONFIG[level];
            const sparkData = generateSparklineData(group.count);

            return (
              <tr
                key={group.fingerprint}
                className="group border-b border-border/30 transition-colors hover:bg-secondary/30"
                style={{ opacity: 0, animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/dashboard/${projectSlug}/issues/${group.fingerprint}`}
                    className="block"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md",
                          config.bg,
                          config.border,
                          "border"
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", config.dot)} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {group.message}
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                          {group.file}:{group.line}
                        </p>
                      </div>
                    </div>
                  </Link>
                </td>

                <td className="hidden px-4 py-4 md:table-cell">
                  <Link href={`/dashboard/${projectSlug}/issues/${group.fingerprint}`}>
                    <Sparkline
                      data={sparkData}
                      width={100}
                      height={28}
                      color={getSparklineColor(level)}
                    />
                  </Link>
                </td>

                <td className="px-4 py-4 text-right">
                  <Link href={`/dashboard/${projectSlug}/issues/${group.fingerprint}`}>
                    <div className="inline-flex items-center gap-2">
                      {group.count > 50 && <Flame className="h-4 w-4 text-amber-400" />}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 font-mono text-sm font-semibold",
                          group.count > 100
                            ? "bg-red-500/20 text-red-400"
                            : group.count > 50
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-secondary text-foreground"
                        )}
                      >
                        {group.count.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </td>

                <td className="hidden px-4 py-4 text-right sm:table-cell">
                  <Link href={`/dashboard/${projectSlug}/issues/${group.fingerprint}`}>
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimeAgo(group.lastSeen)}</span>
                    </div>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
