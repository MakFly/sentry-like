"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Chrome,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface DevicePanelProps {
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  userAgent?: string | null;
  className?: string;
}

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

export function DevicePanel({
  browser,
  os,
  deviceType,
  userAgent,
  className,
}: DevicePanelProps) {
  const [showUserAgent, setShowUserAgent] = useState(false);
  const DeviceIcon = getDeviceIcon(deviceType);

  const hasAnyData = browser || os || deviceType;

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border border-issues-border bg-issues-surface/30 p-4", className)}>
      <div className="mb-4 flex items-center gap-2">
        <DeviceIcon className="h-4 w-4 text-pulse-primary" />
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
          Device
        </h3>
      </div>

      <div className="space-y-3">
        {browser && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Chrome className="h-3.5 w-3.5" />
              <span className="text-xs">Browser</span>
            </div>
            <span className="font-mono text-xs text-foreground">{browser}</span>
          </div>
        )}

        {os && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs">OS</span>
            </div>
            <span className="font-mono text-xs text-foreground">{os}</span>
          </div>
        )}

        {deviceType && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DeviceIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Device</span>
            </div>
            <span className="font-mono text-xs capitalize text-foreground">
              {deviceType}
            </span>
          </div>
        )}

        {/* User Agent collapsible */}
        {userAgent && (
          <div className="border-t border-issues-border pt-3">
            <button
              onClick={() => setShowUserAgent(!showUserAgent)}
              className="flex w-full items-center justify-between text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>User Agent</span>
              {showUserAgent ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>

            {showUserAgent && (
              <div className="mt-2 break-all rounded bg-issues-bg/50 p-2 font-mono text-xs text-muted-foreground">
                {userAgent}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
