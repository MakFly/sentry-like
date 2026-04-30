"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Route, List, FileText, Film } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface SignalsStripProps {
  fingerprint: string;
  orgSlug: string;
  projectSlug: string;
  latestEventId?: string | null;
  latestTraceId?: string | null;
  breadcrumbsCount?: number;
  hasReplay?: boolean;
  latestReplaySessionId?: string | null;
  /** Set to true to skip the IntersectionObserver and fetch logs count immediately. */
  forceVisible?: boolean;
}

/**
 * Compact strip of clickable badges that surface trace / breadcrumbs / logs / replay
 * presence directly in the Issues list row. The logs counter is hydrated lazily once
 * the row enters the viewport — avoids fanning out N parallel correlation queries on mount.
 */
export function SignalsStrip({
  fingerprint,
  orgSlug,
  projectSlug,
  latestEventId,
  latestTraceId,
  breadcrumbsCount = 0,
  hasReplay = false,
  latestReplaySessionId,
  forceVisible = false,
}: SignalsStripProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(forceVisible);

  useEffect(() => {
    if (visible || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  const correlated = trpc.groups.getCorrelatedSignals.useQuery(
    { fingerprint },
    {
      enabled: visible && !!latestTraceId,
      staleTime: 30_000,
    }
  );

  const logsCount = correlated.data?.logsCount ?? null;
  const tracesCount = correlated.data?.transactionsCount ?? null;
  const issueDetailUrl = `/dashboard/${orgSlug}/${projectSlug}/issues/${fingerprint}`;

  // Build the items the row actually has — render only those, no greyed-out placeholders.
  const items: { key: string; href: string; icon: typeof Route; label: string; tone: string }[] = [];

  if (latestTraceId) {
    items.push({
      key: "trace",
      href: `${issueDetailUrl}${latestEventId ? `?event=${encodeURIComponent(latestEventId)}` : ""}#trace`,
      icon: Route,
      label: tracesCount != null ? `trace · ${tracesCount}` : "trace",
      tone: "text-signal-info hover:text-foreground",
    });
  }

  if (breadcrumbsCount > 0) {
    items.push({
      key: "breadcrumbs",
      href: `${issueDetailUrl}${latestEventId ? `?event=${encodeURIComponent(latestEventId)}` : ""}#breadcrumbs`,
      icon: List,
      label: `${breadcrumbsCount} breadcrumb${breadcrumbsCount > 1 ? "s" : ""}`,
      tone: "text-muted-foreground hover:text-foreground",
    });
  }

  if (latestTraceId && (logsCount == null || logsCount > 0)) {
    items.push({
      key: "logs",
      href: `/dashboard/${orgSlug}/${projectSlug}/logs?traceId=${encodeURIComponent(latestTraceId)}`,
      icon: FileText,
      label: logsCount == null ? "logs · …" : `${logsCount} log${logsCount === 1 ? "" : "s"}`,
      tone: "text-signal-warning hover:text-foreground",
    });
  }

  if (hasReplay) {
    const replayHref = latestReplaySessionId
      ? `/dashboard/${orgSlug}/${projectSlug}/replays/${encodeURIComponent(latestReplaySessionId)}`
      : `/dashboard/${orgSlug}/${projectSlug}/replays`;
    items.push({
      key: "replay",
      href: replayHref,
      icon: Film,
      label: "replay",
      tone: "text-signal-ok hover:text-foreground",
    });
  }

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors",
            it.tone
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <it.icon className="h-3 w-3" />
          <span>{it.label}</span>
        </Link>
      ))}
    </div>
  );
}
