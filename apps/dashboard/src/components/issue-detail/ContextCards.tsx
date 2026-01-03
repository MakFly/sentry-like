"use client";

import { cn } from "@/lib/utils";
import {
  Server,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  Package,
} from "lucide-react";

interface Release {
  version: string;
  count: number;
  percentage: number;
}

interface ContextCardsProps {
  env?: string;
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  releases?: Release[];
  firstSeenIn?: string | null;
  className?: string;
}

const envConfig: Record<string, { color: string; dot: string }> = {
  prod: { color: "text-signal-error", dot: "bg-signal-error" },
  production: { color: "text-signal-error", dot: "bg-signal-error" },
  staging: { color: "text-signal-warning", dot: "bg-signal-warning" },
  dev: { color: "text-signal-info", dot: "bg-signal-info" },
  development: { color: "text-signal-info", dot: "bg-signal-info" },
  test: { color: "text-muted-foreground", dot: "bg-muted-foreground" },
  local: { color: "text-muted", dot: "bg-muted" },
};

function getDeviceIcon(deviceType: string | null | undefined) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

function Card({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Server;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-issues-border bg-issues-surface p-4",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function ContextCards({
  env,
  browser,
  os,
  deviceType,
  releases,
  firstSeenIn,
  className,
}: ContextCardsProps) {
  const DeviceIcon = getDeviceIcon(deviceType);
  const envCfg = env ? envConfig[env] || { color: "text-muted-foreground", dot: "bg-muted-foreground" } : null;

  const hasDevice = browser || os || deviceType;
  const hasRelease = releases && releases.length > 0;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* Environment */}
      {env && envCfg && (
        <Card title="Environment" icon={Server}>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full animate-pulse", envCfg.dot)} />
            <span className={cn("font-mono text-sm font-medium", envCfg.color)}>
              {env}
            </span>
          </div>
        </Card>
      )}

      {/* Device */}
      {hasDevice && (
        <Card title="Device" icon={DeviceIcon}>
          <div className="space-y-2">
            {browser && (
              <div className="flex items-center gap-2 text-sm">
                <Chrome className="h-3.5 w-3.5 text-muted" />
                <span className="text-foreground">{browser}</span>
              </div>
            )}
            {os && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted" />
                <span className="text-foreground">{os}</span>
              </div>
            )}
            {deviceType && (
              <div className="flex items-center gap-2 text-sm">
                <DeviceIcon className="h-3.5 w-3.5 text-muted" />
                <span className="text-foreground capitalize">{deviceType}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Release */}
      {hasRelease && (
        <Card title="Release" icon={Package}>
          <div className="space-y-2">
            {/* First seen in */}
            {firstSeenIn && firstSeenIn !== "unknown" && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-muted-foreground">First seen in</span>
                <span className="font-mono text-xs font-medium text-pulse-primary">
                  {firstSeenIn}
                </span>
              </div>
            )}

            {/* Top releases */}
            {releases.slice(0, 3).map((release) => (
              <div key={release.version} className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground">
                  {release.version}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pulse-primary rounded-full"
                      style={{ width: `${release.percentage}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                    {release.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fallback if nothing */}
      {!env && !hasDevice && !hasRelease && (
        <Card title="Context" icon={Server} className="col-span-full">
          <p className="text-sm text-muted-foreground italic">No context data available</p>
        </Card>
      )}
    </div>
  );
}
