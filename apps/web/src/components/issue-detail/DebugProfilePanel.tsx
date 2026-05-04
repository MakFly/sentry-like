"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ArrowDownUp,
  Cpu,
  Database,
  FileCode,
  Globe,
  Hammer,
  KeyRound,
  Mail,
  Radio,
  Route,
  ScrollText,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfileV1 } from "@/server/api/types/error";

interface DebugProfilePanelProps {
  profile: ProfileV1;
}

type TabDef = {
  value: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  alert?: boolean;
};

/**
 * Symfony Web Profiler-inspired full request profile renderer.
 *
 * Layout: dark vertical "profiler menu" rail on the left, light dense
 * data panel on the right with KV blocks and zebra tables.
 */
export function DebugProfilePanel({ profile }: DebugProfilePanelProps) {
  const t = useTranslations("issueDetail.debug");
  const tabs = buildTabList(profile, (key: string) => t(`tabs.${key}`));
  const [active, setActive] = useState(tabs[0]?.value ?? "request");

  if (tabs.length === 0) {
    return <Empty>{t("empty")}</Empty>;
  }

  const current = tabs.find((t) => t.value === active) ?? tabs[0];

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-dashboard-bg lg:flex-row">
      {/* ── Profiler rail ───────────────────────────────────────────────── */}
      <nav
        className={cn(
          "flex shrink-0 flex-row overflow-x-auto border-b border-dashboard-border bg-zinc-100 text-zinc-700",
          "lg:w-[240px] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:border-r",
          "dark:border-black/40 dark:bg-zinc-950 dark:text-zinc-300",
        )}
      >
        <div className="hidden border-b border-dashboard-border px-4 py-3 lg:block dark:border-white/5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Profiler
          </span>
        </div>
        {tabs.map((tab) => {
          const isActive = active === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                "group relative flex shrink-0 items-center gap-2.5 px-4 py-2.5 text-left text-[12px] font-medium transition-colors",
                "border-b border-dashboard-border lg:border-b-0 dark:border-white/5",
                isActive
                  ? "bg-dashboard-surface text-foreground"
                  : "hover:bg-foreground/[0.05] hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              {/* Active accent bar */}
              <span
                className={cn(
                  "absolute left-0 top-0 h-full w-[3px] transition-colors",
                  isActive
                    ? tab.alert
                      ? "bg-signal-error"
                      : "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-transparent",
                )}
                aria-hidden
              />
              <tab.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-foreground"
                    : "text-zinc-500 group-hover:text-foreground dark:text-zinc-400 dark:group-hover:text-white",
                )}
              />
              <span className="flex-1 truncate">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "shrink-0 rounded-sm px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums",
                    tab.alert
                      ? "bg-signal-error text-white"
                      : isActive
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Panel content ────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 bg-dashboard-surface">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-dashboard-border bg-dashboard-surface px-6 py-4 md:px-10">
          <div className="flex items-center gap-2.5">
            <current.icon className="h-4 w-4 text-foreground/70" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
              {current.label}
            </h2>
          </div>
          {current.badge !== undefined && (
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                current.alert
                  ? "bg-signal-error/10 text-signal-error"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {current.badge}
            </span>
          )}
        </div>
        <div className="px-6 py-6 md:px-10">
          {active === "request" && profile.request && <RequestPanel request={profile.request} />}
          {active === "route" && profile.route && <RoutePanel route={profile.route} />}
          {active === "queries" && profile.queries && <QueriesPanel queries={profile.queries} />}
          {active === "cache" && profile.cache && <CachePanel cache={profile.cache} />}
          {active === "mail" && profile.mail && <MailPanel mail={profile.mail} />}
          {active === "events" && profile.events && <EventsPanel events={profile.events} />}
          {active === "views" && profile.views && <ViewsPanel views={profile.views} />}
          {active === "gates" && profile.gates && <GatesPanel gates={profile.gates} />}
          {active === "http_client" && profile.http_client && <HttpClientPanel http={profile.http_client} />}
          {active === "logs" && profile.logs && <LogsPanel logs={profile.logs} />}
          {active === "jobs" && profile.jobs && <JobsPanel jobs={profile.jobs} />}
          {active === "memory" && profile.memory && <MemoryPanel memory={profile.memory} />}
          {active === "timing" && profile.timing && <TimingPanel timing={profile.timing} />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab list resolver ────────────────────────────────────────────────────────
function buildTabList(p: ProfileV1, t: (key: string) => string): TabDef[] {
  const tabs: TabDef[] = [];
  if (p.request) tabs.push({ value: "request", label: t("request"), icon: Globe });
  if (p.route) tabs.push({ value: "route", label: t("route"), icon: Route });

  if (p.queries) {
    const alert = p.queries.slow_count > 0 || p.queries.duplicate_count > 0;
    tabs.push({ value: "queries", label: t("queries"), icon: Database, badge: p.queries.total_count, alert });
  }

  if (p.cache) {
    const total = p.cache.hits + p.cache.misses + p.cache.writes + p.cache.deletes;
    if (total > 0) tabs.push({ value: "cache", label: t("cache"), icon: ArrowDownUp, badge: total });
  }

  if (p.mail && p.mail.total_count > 0) {
    tabs.push({ value: "mail", label: t("mail"), icon: Mail, badge: p.mail.total_count });
  }

  if (p.events && p.events.total_count > 0) {
    tabs.push({ value: "events", label: t("events"), icon: Radio, badge: p.events.total_count });
  }

  if (p.views && p.views.total_count > 0) {
    tabs.push({ value: "views", label: t("views"), icon: FileCode, badge: p.views.total_count });
  }

  if (p.gates && p.gates.total_count > 0) {
    tabs.push({
      value: "gates",
      label: t("gates"),
      icon: KeyRound,
      badge: p.gates.total_count,
      alert: p.gates.denied_count > 0,
    });
  }

  if (p.http_client && p.http_client.total_count > 0) {
    tabs.push({
      value: "http_client",
      label: t("http_client"),
      icon: Globe,
      badge: p.http_client.total_count,
      alert: p.http_client.requests.some((r) => r.status_code === 0 || r.status_code >= 400),
    });
  }

  if (p.logs && p.logs.total_count > 0) {
    tabs.push({
      value: "logs",
      label: t("logs"),
      icon: ScrollText,
      badge: p.logs.total_count,
      alert: p.logs.error_count > 0,
    });
  }

  if (p.jobs && p.jobs.total_count > 0) {
    tabs.push({
      value: "jobs",
      label: t("jobs"),
      icon: Hammer,
      badge: p.jobs.total_count,
      alert: p.jobs.failed_count > 0,
    });
  }

  if (p.memory) tabs.push({ value: "memory", label: t("memory"), icon: Cpu });
  if (p.timing) tabs.push({ value: "timing", label: t("timing"), icon: Timer });

  return tabs;
}

// ─── Panels ───────────────────────────────────────────────────────────────────
function RequestPanel({ request }: { request: NonNullable<ProfileV1["request"]> }) {
  return (
    <div className="space-y-8">
      <KvBlock title="Overview">
        <Kv k="Method" v={request.method} mono />
        <Kv k="URL" v={request.url} mono wrap />
        <Kv k="Path" v={request.path} mono />
        <Kv k="Format" v={request.format || "—"} />
        <Kv k="Content-Type" v={request.content_type || "—"} mono />
        <Kv k="Content-Length" v={String(request.content_length)} mono />
        {request.query_string && <Kv k="Query string" v={request.query_string} mono wrap />}
      </KvBlock>

      <KvBlock title={`Request Headers (${Object.keys(request.headers).length})`}>
        {Object.entries(request.headers).map(([k, v]) => (
          <Kv key={k} k={k} v={Array.isArray(v) ? v.join(", ") : String(v)} mono wrap />
        ))}
      </KvBlock>

      {request.cookies.length > 0 && (
        <KvBlock title={`Cookies (${request.cookies.length})`}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {request.cookies.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        </KvBlock>
      )}

      {request.session && (
        <KvBlock title="Session">
          <Kv k="ID" v={request.session.id} mono />
          {Object.entries(request.session.data).map(([k, v]) => (
            <Kv key={k} k={k} v={typeof v === "string" ? v : JSON.stringify(v)} mono wrap />
          ))}
        </KvBlock>
      )}
    </div>
  );
}

function RoutePanel({ route }: { route: NonNullable<ProfileV1["route"]> }) {
  return (
    <div className="space-y-8">
      <KvBlock title="Route">
        <Kv k="URI" v={route.uri} mono />
        <Kv k="Name" v={route.name ?? "—"} mono />
        <Kv k="Action" v={route.action ?? "—"} mono wrap />
        <Kv k="Controller" v={route.controller ?? "—"} mono wrap />
        <Kv k="Methods" v={route.methods.join(", ")} mono />
        {route.domain && <Kv k="Domain" v={route.domain} mono />}
        {route.prefix && <Kv k="Prefix" v={route.prefix} mono />}
      </KvBlock>

      {route.middleware.length > 0 && (
        <KvBlock title={`Middleware (${route.middleware.length})`}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {route.middleware.map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          </div>
        </KvBlock>
      )}

      {Object.keys(route.parameters).length > 0 && (
        <KvBlock title="Parameters">
          {Object.entries(route.parameters).map(([k, v]) => (
            <Kv key={k} k={k} v={typeof v === "string" ? v : JSON.stringify(v)} mono />
          ))}
        </KvBlock>
      )}
    </div>
  );
}

function QueriesPanel({ queries }: { queries: NonNullable<ProfileV1["queries"]> }) {
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Queries" value={queries.total_count} />
        <Metric label="Total time" value={`${queries.total_time_ms.toFixed(1)} ms`} />
        <Metric label="Slow" value={queries.slow_count} tone={queries.slow_count > 0 ? "danger" : "neutral"} />
        <Metric label="Duplicates" value={queries.duplicate_count} tone={queries.duplicate_count > 0 ? "warn" : "neutral"} />
      </MetricsRow>

      <SectionTitle>Database queries</SectionTitle>
      <ol className="space-y-2">
        {queries.items.map((q, i) => (
          <li
            key={i}
            className={cn(
              "border border-dashboard-border bg-dashboard-surface",
              q.is_slow && "border-l-2 border-l-signal-error",
              q.is_duplicate && !q.is_slow && "border-l-2 border-l-signal-warning",
            )}
          >
            <div className="flex items-center gap-3 border-b border-dashboard-border bg-foreground/[0.06] px-3 py-1.5">
              <span className="font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                #{i + 1}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {q.connection}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {q.is_slow && <Tag tone="danger">slow</Tag>}
                {q.is_duplicate && <Tag tone="warn">×{q.duplicate_count}</Tag>}
                <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                  {q.time_ms.toFixed(2)} ms
                </span>
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-foreground">
              {q.bound_sql}
            </pre>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CachePanel({ cache }: { cache: NonNullable<ProfileV1["cache"]> }) {
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Hits" value={cache.hits} tone="ok" />
        <Metric label="Misses" value={cache.misses} tone={cache.misses > 0 ? "warn" : "neutral"} />
        <Metric label="Writes" value={cache.writes} />
        <Metric label="Deletes" value={cache.deletes} />
        <Metric label="Hit ratio" value={`${cache.hit_ratio}%`} />
      </MetricsRow>
      <Table headers={["Type", "Key", "Store"]}>
        {cache.operations.map((op, i) => (
          <Tr key={i} index={i}>
            <Td>
              <Tag tone={op.type === "miss" ? "danger" : op.type === "hit" ? "ok" : "neutral"}>
                {op.type}
              </Tag>
            </Td>
            <Td mono>{op.key}</Td>
            <Td mono muted>{op.store ?? "—"}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

function MailPanel({ mail }: { mail: NonNullable<ProfileV1["mail"]> }) {
  return (
    <div className="space-y-3">
      {mail.messages.map((m, i) => (
        <div key={i} className="border border-dashboard-border bg-dashboard-surface">
          <div className="border-b border-dashboard-border bg-foreground/[0.06] px-3 py-2">
            <div className="font-mono text-sm font-semibold text-foreground">
              {m.subject || "(no subject)"}
            </div>
          </div>
          <div className="divide-y divide-dashboard-border">
            <Kv k="From" v={m.from.join(", ") || "—"} mono />
            <Kv k="To" v={m.to.join(", ") || "—"} mono />
            {m.cc.length > 0 && <Kv k="CC" v={m.cc.join(", ")} mono />}
            {m.bcc.length > 0 && <Kv k="BCC" v={m.bcc.join(", ")} mono />}
          </div>
          {m.body_excerpt && (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-t border-dashboard-border bg-foreground/[0.04] p-3 font-mono text-[11px]">
              {m.body_excerpt}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function EventsPanel({ events }: { events: NonNullable<ProfileV1["events"]> }) {
  const rows = Object.entries(events.byName).sort((a, b) => b[1].count - a[1].count);
  return (
    <Table headers={["Event", "Count", "Listeners", "Total ms"]}>
      {rows.map(([name, e], i) => (
        <Tr key={name} index={i}>
          <Td mono wrap>{name}</Td>
          <Td num>{e.count}</Td>
          <Td num>{e.listeners}</Td>
          <Td num>{e.total_duration_ms.toFixed(2)}</Td>
        </Tr>
      ))}
    </Table>
  );
}

function ViewsPanel({ views }: { views: NonNullable<ProfileV1["views"]> }) {
  return (
    <div className="space-y-2">
      {views.items.map((v, i) => (
        <div key={i} className="border border-dashboard-border bg-dashboard-surface px-3 py-2">
          <div className="font-mono text-[12.5px] text-foreground">{v.name}</div>
          <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">{v.path}</div>
          {v.data_keys.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {v.data_keys.map((k) => (
                <Tag key={k}>{k}</Tag>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GatesPanel({ gates }: { gates: NonNullable<ProfileV1["gates"]> }) {
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Allowed" value={gates.allowed_count} tone="ok" />
        <Metric label="Denied" value={gates.denied_count} tone={gates.denied_count > 0 ? "danger" : "neutral"} />
      </MetricsRow>
      <Table headers={["Ability", "Result", "User", "Args"]}>
        {gates.checks.map((c, i) => (
          <Tr key={i} index={i}>
            <Td mono>{c.ability}</Td>
            <Td>
              <Tag tone={c.result ? "ok" : "danger"}>{c.result ? "allow" : "deny"}</Tag>
            </Td>
            <Td mono>{c.user ?? "—"}</Td>
            <Td mono muted>{c.arguments_classes.join(", ") || "—"}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

function HttpClientPanel({ http }: { http: NonNullable<ProfileV1["http_client"]> }) {
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Calls" value={http.total_count} />
        <Metric label="Total time" value={`${http.total_duration_ms.toFixed(1)} ms`} />
      </MetricsRow>
      <Table headers={["Method", "URL", "Status", "ms"]}>
        {http.requests.map((r, i) => {
          const failed = r.status_code === 0 || r.status_code >= 400;
          return (
            <Tr key={i} index={i}>
              <Td mono>{r.method}</Td>
              <Td mono wrap>{r.url}</Td>
              <Td>
                <Tag tone={failed ? "danger" : "ok"}>{r.status_code || "fail"}</Tag>
              </Td>
              <Td num>{r.duration_ms.toFixed(1)}</Td>
            </Tr>
          );
        })}
      </Table>
    </div>
  );
}

function LogsPanel({ logs }: { logs: NonNullable<ProfileV1["logs"]> }) {
  return (
    <div className="space-y-6">
      <MetricsRow>
        {Object.entries(logs.counts_by_level).map(([level, count]) => (
          <Metric key={level} label={level} value={count} tone={isErrorLevel(level) ? "danger" : "neutral"} />
        ))}
      </MetricsRow>
      <ol className="space-y-1.5">
        {logs.items.map((l, i) => (
          <li
            key={i}
            className={cn(
              "border border-dashboard-border bg-dashboard-surface",
              isErrorLevel(l.level) && "border-l-2 border-l-signal-error",
            )}
          >
            <div className="flex items-start gap-3 px-3 py-2">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-4 shrink-0 items-center rounded-sm px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                  isErrorLevel(l.level)
                    ? "bg-signal-error text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {l.level}
              </span>
              <span className="break-words font-mono text-[11.5px] leading-relaxed text-foreground">
                {l.message}
              </span>
            </div>
            {Object.keys(l.context).length > 0 && (
              <pre className="overflow-x-auto border-t border-dashboard-border bg-foreground/[0.04] px-3 py-2 font-mono text-[10.5px] leading-relaxed">
                {JSON.stringify(l.context, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function JobsPanel({ jobs }: { jobs: NonNullable<ProfileV1["jobs"]> }) {
  return (
    <Table headers={["Queue", "Class", "Status", "ms"]}>
      {jobs.items.map((j, i) => (
        <Tr key={i} index={i}>
          <Td mono>{j.queue}</Td>
          <Td mono wrap>{j.class}</Td>
          <Td>
            <Tag tone={j.status === "failed" ? "danger" : j.status === "processed" ? "ok" : "neutral"}>
              {j.status}
            </Tag>
          </Td>
          <Td num>{j.duration_ms.toFixed(1)}</Td>
        </Tr>
      ))}
    </Table>
  );
}

function MemoryPanel({ memory }: { memory: NonNullable<ProfileV1["memory"]> }) {
  const peakMb = memory.peak_bytes / 1024 / 1024;
  const limitMb = memory.limit_bytes > 0 ? memory.limit_bytes / 1024 / 1024 : null;
  const ratioPct = Math.round(memory.usage_ratio * 100);
  const tone = ratioPct > 80 ? "danger" : ratioPct > 60 ? "warn" : "neutral";
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Peak" value={`${peakMb.toFixed(1)} MB`} />
        <Metric label="Limit" value={limitMb ? `${limitMb.toFixed(0)} MB` : "no limit"} />
        <Metric label="Usage" value={`${ratioPct}%`} tone={tone} />
        {memory.opcache_mb !== null && <Metric label="Opcache" value={`${memory.opcache_mb} MB`} />}
      </MetricsRow>
      {limitMb && (
        <div className="border border-dashboard-border bg-dashboard-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Memory usage
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
              {peakMb.toFixed(1)} / {limitMb.toFixed(0)} MB
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
            <div
              className={cn(
                "h-full transition-all",
                tone === "danger" ? "bg-signal-error" : tone === "warn" ? "bg-signal-warning" : "bg-emerald-500",
              )}
              style={{ width: `${Math.min(ratioPct, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TimingPanel({ timing }: { timing: NonNullable<ProfileV1["timing"]> }) {
  const totalMs = timing.duration_ms || 1;
  const events = Object.entries(timing.events);
  return (
    <div className="space-y-6">
      <MetricsRow>
        <Metric label="Total duration" value={`${timing.duration_ms.toFixed(1)} ms`} />
        <Metric label="Events" value={events.length} />
      </MetricsRow>
      {events.length > 0 && (
        <>
          <SectionTitle>Timeline</SectionTitle>
          <div className="border border-dashboard-border bg-dashboard-surface">
            {events.map(([name, e], i) => {
              const left = (e.start / totalMs) * 100;
              const width = Math.max((e.duration / totalMs) * 100, 0.4);
              return (
                <div
                  key={name}
                  className={cn(
                    "grid grid-cols-[minmax(160px,1fr)_2fr_auto] items-center gap-3 px-3 py-2",
                    i !== 0 && "border-t border-dashboard-border",
                  )}
                >
                  <span className="truncate font-mono text-[11px] text-foreground">{name}</span>
                  <div className="relative h-1.5 w-full rounded-sm bg-muted">
                    <div
                      className="absolute top-0 h-full rounded-sm bg-emerald-500/70"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-foreground">
                    {e.duration.toFixed(2)} ms
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3 w-[3px] bg-foreground/70" aria-hidden />
      <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground">
        {children}
      </h3>
    </div>
  );
}

function KvBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-2.5 border border-dashboard-border bg-dashboard-surface">
        <div className="divide-y divide-dashboard-border">{children}</div>
      </div>
    </section>
  );
}

function Kv({
  k,
  v,
  mono = false,
  wrap = false,
}: {
  k: string;
  v: string;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-baseline gap-3 px-3 py-1.5 odd:bg-foreground/[0.04]">
      <div className="truncate text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {k}
      </div>
      <div
        className={cn(
          "min-w-0 text-[12px] text-foreground",
          mono && "font-mono",
          wrap ? "break-all" : "truncate",
        )}
      >
        {v}
      </div>
    </div>
  );
}

function MetricsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-sm border border-dashboard-border bg-dashboard-border">
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-signal-error"
      : tone === "warn"
        ? "text-signal-warning"
        : tone === "ok"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground";
  return (
    <div className="min-w-[120px] flex-1 bg-dashboard-surface px-4 py-2.5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-lg font-semibold tabular-nums leading-none", toneClass)}>
        {value}
      </div>
    </div>
  );
}

function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center rounded-sm px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
        tone === "danger" && "bg-signal-error text-white",
        tone === "warn" && "bg-signal-warning text-black",
        tone === "ok" && "bg-emerald-600 text-white dark:bg-emerald-500",
        tone === "neutral" && "bg-muted text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-dashboard-border">
      <table className="min-w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Tr({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <tr
      className={cn(
        "border-t border-dashboard-border transition-colors hover:bg-foreground/[0.07]",
        index % 2 === 1 && "bg-foreground/[0.04]",
      )}
    >
      {children}
    </tr>
  );
}

function Td({
  children,
  mono,
  num,
  muted,
  wrap,
}: {
  children: React.ReactNode;
  mono?: boolean;
  num?: boolean;
  muted?: boolean;
  wrap?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 py-1.5 align-middle",
        mono && "font-mono",
        num && "font-mono tabular-nums",
        muted && "text-muted-foreground",
        wrap && "break-all",
      )}
    >
      {children}
    </td>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-12 text-center text-sm text-muted-foreground">{children}</p>;
}

function isErrorLevel(level: string): boolean {
  return ["error", "critical", "alert", "emergency"].includes(level);
}
