"use client";

import { cn } from "@/lib/utils";
import { Package, Tag } from "lucide-react";

interface Release {
  version: string;
  count: number;
  percentage: number;
}

interface ReleasesPanelProps {
  releases: Release[];
  firstSeenIn?: string | null;
  className?: string;
}

export function ReleasesPanel({
  releases,
  firstSeenIn,
  className,
}: ReleasesPanelProps) {
  if (!releases || releases.length === 0) {
    return null;
  }

  // Filter out "unknown" releases if there are named ones
  const namedReleases = releases.filter((r) => r.version !== "unknown");
  const displayReleases = namedReleases.length > 0 ? namedReleases : releases;

  return (
    <div className={cn("rounded-lg border border-issues-border bg-issues-surface/30 p-4", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-pulse-primary" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Releases
          </h3>
        </div>
      </div>

      {/* First seen badge */}
      {firstSeenIn && firstSeenIn !== "unknown" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-pulse-secondary/30 bg-pulse-secondary/10 px-3 py-2">
          <Tag className="h-3.5 w-3.5 text-pulse-secondary" />
          <span className="text-xs text-muted-foreground">First seen in</span>
          <span className="font-mono text-xs font-semibold text-pulse-secondary">
            {firstSeenIn}
          </span>
        </div>
      )}

      {/* Releases distribution */}
      <div className="space-y-3">
        {displayReleases.slice(0, 5).map((release, index) => {
          // Color gradient: most recent = brighter
          const opacity = 1 - (index * 0.15);

          return (
            <div key={release.version} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-foreground">
                  {release.version}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {release.count.toLocaleString()} ({release.percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-issues-border">
                <div
                  className="h-full rounded-full bg-pulse-primary transition-all"
                  style={{
                    width: `${release.percentage}%`,
                    opacity,
                  }}
                />
              </div>
            </div>
          );
        })}

        {displayReleases.length > 5 && (
          <p className="text-center text-xs text-muted-foreground">
            +{displayReleases.length - 5} more releases
          </p>
        )}
      </div>
    </div>
  );
}
