"use client";

import { cn } from "@/lib/utils";
import {
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Server,
} from "lucide-react";

interface TagsPanelProps {
  env?: string;
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  onTagClick?: (tag: string, value: string) => void;
  className?: string;
}

const envColors: Record<string, string> = {
  prod: "bg-signal-fatal/10 text-signal-fatal border-signal-fatal/30",
  production: "bg-signal-fatal/10 text-signal-fatal border-signal-fatal/30",
  staging: "bg-signal-warning/10 text-signal-warning border-signal-warning/30",
  dev: "bg-signal-info/10 text-signal-info border-signal-info/30",
  development: "bg-signal-info/10 text-signal-info border-signal-info/30",
  test: "bg-signal-debug/10 text-signal-debug border-signal-debug/30",
  local: "bg-muted/50 text-muted-foreground border-muted",
};

function getDeviceIcon(deviceType: string | null | undefined) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    case "desktop":
    default:
      return Monitor;
  }
}

export function TagsPanel({
  env,
  browser,
  os,
  deviceType,
  onTagClick,
  className,
}: TagsPanelProps) {
  const DeviceIcon = getDeviceIcon(deviceType);
  const hasAnyTag = env || browser || os || deviceType;

  if (!hasAnyTag) {
    return null;
  }

  const tags = [
    {
      key: "env",
      label: "Environment",
      value: env,
      icon: Server,
      colorClass: env ? envColors[env] || "bg-muted/50 text-muted-foreground border-muted" : null,
    },
    {
      key: "browser",
      label: "Browser",
      value: browser,
      icon: Chrome,
      colorClass: "bg-issues-bg/50 text-foreground border-issues-border",
    },
    {
      key: "os",
      label: "OS",
      value: os,
      icon: Globe,
      colorClass: "bg-issues-bg/50 text-foreground border-issues-border",
    },
    {
      key: "device",
      label: "Device",
      value: deviceType,
      icon: DeviceIcon,
      colorClass: "bg-issues-bg/50 text-foreground border-issues-border",
    },
  ].filter((tag) => tag.value);

  return (
    <div className={cn("rounded-lg border border-issues-border bg-issues-surface/30 p-4", className)}>
      <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
        Tags
      </h3>

      <div className="space-y-2">
        {tags.map((tag) => {
          const Icon = tag.icon;
          return (
            <button
              key={tag.key}
              onClick={() => onTagClick?.(tag.key, tag.value!)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                tag.colorClass,
                onTagClick && "hover:opacity-80 cursor-pointer"
              )}
              disabled={!onTagClick}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="text-xs font-medium opacity-70">{tag.label}</span>
              </div>
              <span className="font-mono text-xs font-semibold">{tag.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
