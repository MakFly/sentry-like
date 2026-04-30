"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useGroup, useGroupEvents, useGroupTimeline } from "@/lib/trpc/hooks";
import { trpc } from "@/lib/trpc/client";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErrorLevel } from "@/server/api";

import { EventTimeline, StackTraceViewer, ContextCards } from "@/components/issue-detail";

// ─── helpers ─────────────────────────────────────────────────────────────────

const levelColor: Record<ErrorLevel, string> = {
  fatal: "text-signal-fatal",
  error: "text-signal-error",
  warning: "text-signal-warning",
  info: "text-signal-info",
  debug: "text-signal-debug",
};

const levelBg: Record<ErrorLevel, string> = {
  fatal: "bg-signal-fatal/10 text-signal-fatal border-signal-fatal/30",
  error: "bg-signal-error/10 text-signal-error border-signal-error/30",
  warning: "bg-signal-warning/10 text-signal-warning border-signal-warning/30",
  info: "bg-signal-info/10 text-signal-info border-signal-info/30",
  debug: "bg-signal-debug/10 text-signal-debug border-signal-debug/30",
};

function parseExceptionType(message: string): { type: string | null; cleanMessage: string } {
  const match = message.match(/^(?:Uncaught\s+)?(\w+(?:Error|Exception|Fault)):\s*([\s\S]*)$/);
  if (match) return { type: match[1], cleanMessage: match[2] };
  return { type: null, cleanMessage: message };
}

function formatRel(date: string | Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
      aria-label="copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-signal-ok" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 36;
  const pad = 2;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const fill = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full text-signal-error" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#spark-fill)" />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Section primitive (Sentry-style collapsible card) ───────────────────────

function Section({
  title,
  count,
  badge,
  defaultOpen = true,
  anchor,
  children,
}: {
  title: string;
  count?: number;
  badge?: ReactNode;
  defaultOpen?: boolean;
  /** HTML id used as a fragment anchor target (e.g. "stack", "breadcrumbs"). When the URL hash matches, the section auto-opens and scrolls into view. */
  anchor?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Hash-driven auto-open + scroll into view (e.g. /issues/<fp>#breadcrumbs).
  useEffect(() => {
    if (!anchor) return;
    const apply = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && hash === anchor) {
        setOpen(true);
        // Defer to next tick so the collapsible content has expanded.
        requestAnimationFrame(() => {
          document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [anchor]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      id={anchor}
      className="border-b border-dashboard-border scroll-mt-24"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-6 py-3 text-left transition-colors hover:bg-muted/20 md:px-8">
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">{title}</span>
        {count !== undefined && (
          <span className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {count}
          </span>
        )}
        {badge && <span className="ml-2">{badge}</span>}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

// ─── Event Highlights (promoted tags / context) ──────────────────────────────

function EventHighlights({
  event,
}: {
  event: {
    tags?: Record<string, string> | null;
    userContext?: { id?: string; email?: string; username?: string; ip_address?: string } | null;
    release?: string | null;
    env?: string;
    platform?: string | null;
    serverName?: string | null;
  };
}) {
  const chips: { label: string; value: string }[] = [];
  if (event.env) chips.push({ label: "env", value: event.env });
  if (event.release) chips.push({ label: "release", value: event.release });
  if (event.platform) chips.push({ label: "platform", value: event.platform });
  if (event.serverName) chips.push({ label: "server", value: event.serverName });
  if (event.userContext?.id) chips.push({ label: "user.id", value: event.userContext.id });
  if (event.userContext?.email) chips.push({ label: "user.email", value: event.userContext.email });
  if (event.tags) {
    for (const [k, v] of Object.entries(event.tags).slice(0, 6)) {
      chips.push({ label: k, value: String(v) });
    }
  }
  if (chips.length === 0) {
    return <p className="px-6 py-3 text-xs text-muted-foreground md:px-8">No tags or user context on this event.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 px-6 pb-4 pt-1 md:px-8">
      {chips.map((c) => (
        <span
          key={`${c.label}-${c.value}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashboard-border bg-muted/30 px-2 py-1 font-mono text-[11px]"
        >
          <span className="text-muted-foreground">{c.label}</span>
          <span className="text-muted-foreground/40">=</span>
          <span className="font-medium text-foreground">{c.value}</span>
        </span>
      ))}
    </div>
  );
}

function RelatedLogs({
  logs,
}: {
  logs: Array<{
    id: string;
    level: string;
    channel: string;
    message: string;
    traceId?: string | null;
    spanId?: string | null;
    createdAt: string | Date;
  }>;
}) {
  if (logs.length === 0) {
    return <p className="px-6 py-3 text-xs text-muted-foreground md:px-8">No logs share this issue trace.</p>;
  }

  return (
    <div className="divide-y divide-dashboard-border/60">
      {logs.map((log) => (
        <div key={log.id} className="px-6 py-3 md:px-8">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className={cn("font-bold uppercase", levelColor[log.level as ErrorLevel] ?? "text-muted-foreground")}>
              {log.level}
            </span>
            <span className="rounded border border-dashboard-border bg-muted/30 px-1.5 py-0.5 text-muted-foreground">
              {log.channel}
            </span>
            <span className="text-muted-foreground">{formatRel(log.createdAt)}</span>
            {log.traceId && (
              <code className="min-w-0 truncate text-muted-foreground/70">
                trace {log.traceId.slice(0, 12)}
                {log.spanId ? ` · span ${log.spanId.slice(0, 8)}` : ""}
              </code>
            )}
          </div>
          <div className="flex min-w-0 items-start gap-2">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="break-words font-mono text-sm leading-6 text-foreground">{log.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel({
  group,
  selectedEvent,
  logs,
}: {
  group: {
    title?: string;
    message: string;
    exceptionType?: string | null;
    exceptionValue?: string | null;
    file: string;
    line: number;
  };
  selectedEvent: {
    traceId?: string | null;
    spanId?: string | null;
    request?: { url?: string; method?: string } | null;
  } | null;
  logs: Array<{
    id: string;
    level: string;
    channel: string;
    message: string;
    traceId?: string | null;
    spanId?: string | null;
    createdAt: string | Date;
  }>;
}) {
  const primaryLog = logs.find((log) => log.level === "error") ?? logs[0] ?? null;
  const displayTitle = group.title || [group.exceptionType, group.exceptionValue].filter(Boolean).join(": ") || group.message;
  const request = selectedEvent?.request;

  return (
    <section className="border-b border-dashboard-border bg-background">
      <div className="grid grid-cols-1 gap-px bg-dashboard-border lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-background px-6 py-5 md:px-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Primary Evidence</span>
            {primaryLog && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className={levelColor[primaryLog.level as ErrorLevel] ?? "text-muted-foreground"}>
                  {primaryLog.level}
                </span>
                <span className="text-muted-foreground">{primaryLog.channel}</span>
              </>
            )}
          </div>

          {primaryLog ? (
            <div className="rounded-md border border-dashboard-border bg-muted/20 p-4">
              <p className="break-words font-mono text-base leading-7 text-foreground">{primaryLog.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span>{formatRel(primaryLog.createdAt)}</span>
                {primaryLog.traceId && <code>trace {primaryLog.traceId}</code>}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashboard-border bg-muted/20 p-4">
              <p className="break-words font-mono text-base leading-7 text-foreground">{displayTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">No correlated log found for this trace.</p>
            </div>
          )}

          <div className="mt-4 flex min-w-0 items-center gap-2">
            <code className="min-w-0 break-all font-mono text-sm">
              <span className="text-signal-info">{group.file}</span>
              <span className="text-muted-foreground/60">:</span>
              <span className="text-signal-warning">{group.line}</span>
            </code>
            <CopyInline text={`${group.file}:${group.line}`} />
          </div>
        </div>

        <div className="bg-background px-6 py-5 md:px-8">
          <div className="space-y-4">
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Exception
              </div>
              <div className="mt-1 break-words font-mono text-sm text-foreground">{displayTitle}</div>
            </div>
            {request?.url && (
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Request
                </div>
                <div className="mt-1 break-all font-mono text-sm text-foreground">
                  {request.method && <span className="mr-2 font-bold text-signal-ok">{request.method}</span>}
                  {request.url}
                </div>
              </div>
            )}
            {selectedEvent?.traceId && (
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trace
                </div>
                <code className="mt-1 block break-all font-mono text-sm text-foreground">
                  {selectedEvent.traceId}
                  {selectedEvent.spanId && <span className="text-muted-foreground"> / {selectedEvent.spanId}</span>}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Right sidebar (metadata) ────────────────────────────────────────────────

function MetadataSidebar({
  group,
  selectedEvent,
  timelineData,
  releases,
}: {
  group: {
    count: number;
    firstSeen: string | Date;
    lastSeen: string | Date;
    statusCode?: number | null;
  };
  selectedEvent: {
    env?: string;
    release?: string | null;
    platform?: string | null;
    userContext?: { id?: string } | null;
  } | null;
  timelineData: { date: string; count: number }[];
  releases?: { version: string; count: number; percentage: number }[];
}) {
  const tOcc = useTranslations("issueDetail.occurrenceChart");
  return (
    <aside className="flex flex-col gap-px bg-dashboard-border">
      <SidebarStat label={tOcc("occurrences")} value={group.count.toLocaleString()} mono />
      <SidebarStat label={tOcc("firstSeen")} value={formatRel(group.firstSeen)} />
      <SidebarStat label={tOcc("lastSeen")} value={formatRel(group.lastSeen)} />
      {selectedEvent?.env && <SidebarStat label="Environment" value={selectedEvent.env} />}
      {selectedEvent?.release && <SidebarStat label="Release" value={selectedEvent.release} mono />}
      {selectedEvent?.platform && <SidebarStat label="Platform" value={selectedEvent.platform} />}

      <div className="bg-background px-5 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tOcc("last30days")}
        </div>
        <div className="mt-2">
          <Sparkline data={timelineData.map((p) => p.count)} />
        </div>
      </div>

      {releases && releases.length > 0 && (
        <div className="bg-background px-5 py-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Releases · {releases.length}
          </div>
          <ul className="space-y-1.5">
            {releases.slice(0, 5).map((r) => (
              <li key={r.version} className="flex items-center justify-between font-mono text-xs">
                <span className="truncate text-foreground">{r.version}</span>
                <span className="ml-2 shrink-0 text-muted-foreground">
                  {r.count}
                  <span className="ml-1 text-muted-foreground/60">·</span>
                  <span className="ml-1">{r.percentage}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function SidebarStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background px-5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-base text-foreground", mono ? "font-mono tabular-nums" : "")}>{value}</div>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────

function ErrorState() {
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();
  const t = useTranslations("issueDetail.errorPage");

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-dashboard-border px-6 py-3 md:px-8">
        <Link
          href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono">{t("back")}</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-24">
        <AlertTriangle className="h-12 w-12 text-signal-error" strokeWidth={1.5} />
        <h3 className="mt-6 font-mono text-xl text-signal-error">{t("signalNotFound")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("signalNotFoundDesc")}</p>
        <Link
          href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
          className="mt-6 font-mono text-sm text-pulse-primary hover:text-pulse-primary/80"
        >
          {t("returnToIssues")}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function IssueDetailPage() {
  const params = useParams();
  const fingerprint = params.fingerprint as string;
  const searchParams = useSearchParams();
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();
  const tHeader = useTranslations("issueDetail.header");
  const tSeverity = useTranslations("issues.severity");

  const { data: group, isLoading, error } = useGroup(fingerprint);
  const { data: eventsData } = useGroupEvents(fingerprint, 1, 50);
  // Initial selection comes from `?event=<id>` (deep-link from the Issues list signals strip).
  const initialEventId = searchParams?.get("event") ?? null;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const { data: timeline } = useGroupTimeline(fingerprint);
  const { data: releasesData } = trpc.groups.getReleases.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const { data: correlatedData } = trpc.groups.getCorrelatedSignals.useQuery(
    { fingerprint },
    { enabled: !!fingerprint }
  );

  const events = eventsData?.events || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    if (selectedEventId) return events.find((e) => e.id === selectedEventId) || events[0];
    return events[0];
  }, [events, selectedEventId]);

  const eventIndex = useMemo(() => {
    if (!selectedEvent) return -1;
    return events.findIndex((e) => e.id === selectedEvent.id);
  }, [events, selectedEvent]);

  if (isLoading) return null;
  if (error || !group) return <ErrorState />;

  const timelineData =
    timeline && timeline.length > 0
      ? timeline.map((p) => ({ date: p.date, count: p.count }))
      : [{ date: new Date(group.firstSeen).toISOString().split("T")[0], count: group.count }];

  const titleSource = group.title && group.title.length > 0 ? group.title : group.message;
  const { type: exceptionType, cleanMessage } = parseExceptionType(titleSource);
  const lvlColor = levelColor[group.level as ErrorLevel];
  const lvlBg = levelBg[group.level as ErrorLevel];
  const breadcrumbsCount = Array.isArray(selectedEvent?.breadcrumbs)
    ? selectedEvent!.breadcrumbs.length
    : 0;
  const correlatedLogs = correlatedData?.logs ?? [];
  const primaryLogId = (correlatedLogs.find((log) => log.level === "error") ?? correlatedLogs[0])?.id ?? null;
  const secondaryLogs = primaryLogId ? correlatedLogs.filter((log) => log.id !== primaryLogId) : correlatedLogs;

  const hasPrev = eventIndex > 0;
  const hasNext = eventIndex >= 0 && eventIndex < events.length - 1;

  return (
    <div className="flex flex-1 flex-col">
      {/* Back link */}
      <div className="border-b border-dashboard-border px-6 py-2.5 md:px-8">
        <Link
          href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
          className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tHeader("issues")}</span>
        </Link>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-dashboard-border bg-background/95 px-6 py-5 backdrop-blur md:px-8 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider",
                  lvlBg
                )}
              >
                {group.statusCode ? `${group.statusCode} ${tSeverity(group.level)}` : tSeverity(group.level)}
              </span>
              {exceptionType && (
                <span className={cn("font-mono text-xs font-bold uppercase tracking-wider", lvlColor)}>
                  {exceptionType}
                </span>
              )}
            </div>

            <h1 className="font-mono text-xl font-medium leading-snug text-foreground md:text-2xl">
              {cleanMessage}
            </h1>
          </div>
        </div>
      </header>

      <EvidencePanel
        group={{
          title: group.title,
          message: group.message,
          exceptionType: group.exceptionType,
          exceptionValue: group.exceptionValue,
          file: group.file,
          line: group.line,
        }}
        selectedEvent={
          selectedEvent
            ? {
                traceId: selectedEvent.traceId,
                spanId: selectedEvent.spanId,
                request: selectedEvent.request ?? null,
              }
            : null
        }
        logs={correlatedLogs}
      />

      {events.length > 1 && (
      <div className="border-b border-dashboard-border bg-background px-6 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Event</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">
              {events.length === 0 ? (
                "—"
              ) : (
                <>
                  {eventIndex + 1} <span className="text-muted-foreground">of {events.length}</span>
                </>
              )}
            </div>
            {selectedEvent && (
              <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                {selectedEvent.id.slice(0, 8)} · {formatRel(selectedEvent.createdAt)}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrev}
              onClick={() => hasPrev && setSelectedEventId(events[eventIndex - 1].id)}
              aria-label="Previous event"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext}
              onClick={() => hasNext && setSelectedEventId(events[eventIndex + 1].id)}
              aria-label="Next event"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Main content: stacked sections + sidebar */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 border-r-0 border-dashboard-border lg:border-r">
          {secondaryLogs.length > 0 && (
            <Section title="Related Logs" anchor="logs" count={secondaryLogs.length} defaultOpen={false}>
              <RelatedLogs logs={secondaryLogs} />
            </Section>
          )}

          <Section title="Stack Trace" anchor="stack" defaultOpen={false}>
            <StackTraceViewer
              stack={selectedEvent?.stack || "No stack trace available"}
              highlightFile={group.file}
              highlightLine={group.line}
            />
          </Section>

          <Section title="Breadcrumbs" anchor="breadcrumbs" count={breadcrumbsCount} defaultOpen={false}>
            {selectedEvent && (
              <EventTimeline
                breadcrumbs={selectedEvent.breadcrumbs}
                errorTimestamp={selectedEvent.createdAt}
                errorMessage={group.message}
                sessionId={selectedEvent.sessionId}
                errorEventId={selectedEvent.id}
                orgSlug={currentOrgSlug || ""}
                projectSlug={currentProjectSlug || ""}
              />
            )}
          </Section>

          <Section title="Event Context" anchor="highlights" defaultOpen={false}>
            {selectedEvent ? (
              <EventHighlights
                event={{
                  tags: selectedEvent.tags ?? null,
                  userContext: selectedEvent.userContext ?? null,
                  release: selectedEvent.release ?? null,
                  env: selectedEvent.env,
                  platform: selectedEvent.platform ?? null,
                  serverName: selectedEvent.serverName ?? null,
                }}
              />
            ) : (
              <p className="px-6 py-3 text-xs text-muted-foreground md:px-8">No event data.</p>
            )}
          </Section>

          <Section title="Contexts" anchor="contexts" defaultOpen={false}>
            <ContextCards
              env={selectedEvent?.env}
              contexts={selectedEvent?.contexts}
              releases={releasesData?.releases}
              firstSeenIn={releasesData?.firstSeenIn}
            />
          </Section>
        </div>

        <MetadataSidebar
          group={{
            count: group.count,
            firstSeen: group.firstSeen,
            lastSeen: group.lastSeen,
            statusCode: group.statusCode,
          }}
          selectedEvent={
            selectedEvent
              ? {
                  env: selectedEvent.env,
                  release: selectedEvent.release ?? null,
                  platform: selectedEvent.platform ?? null,
                  userContext: selectedEvent.userContext ?? null,
                }
              : null
          }
          timelineData={timelineData}
          releases={releasesData?.releases}
        />
      </div>
    </div>
  );
}
