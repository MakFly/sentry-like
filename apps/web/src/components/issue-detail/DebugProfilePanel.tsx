"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfileV1 } from "@/server/api/types/error";

interface DebugProfilePanelProps {
  profile: ProfileV1;
}

/**
 * Full request profile renderer (parity with laravel-web-profiler).
 *
 * Receives the SDK-produced profile snapshot attached to a captured exception
 * and shows one tab per panel (request, route, queries, cache, mail, events,
 * views, gates, http client, logs, jobs, memory, timing).
 */
export function DebugProfilePanel({ profile }: DebugProfilePanelProps) {
  const tabs = buildTabList(profile);

  if (tabs.length === 0) {
    return <Empty>No profiler data was captured for this event.</Empty>;
  }

  return (
    <div className="px-6 py-4 md:px-8">
      <ProfileSummary profile={profile} />

      <Tabs defaultValue={tabs[0].value} className="mt-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
              {t.label}
              {t.badge !== undefined && (
                <Badge variant={t.badgeVariant ?? "secondary"} className="h-4 px-1.5 text-[10px]">
                  {t.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="request">{profile.request && <RequestPanel request={profile.request} />}</TabsContent>
        <TabsContent value="route">{profile.route && <RoutePanel route={profile.route} />}</TabsContent>
        <TabsContent value="queries">{profile.queries && <QueriesPanel queries={profile.queries} />}</TabsContent>
        <TabsContent value="cache">{profile.cache && <CachePanel cache={profile.cache} />}</TabsContent>
        <TabsContent value="mail">{profile.mail && <MailPanel mail={profile.mail} />}</TabsContent>
        <TabsContent value="events">{profile.events && <EventsPanel events={profile.events} />}</TabsContent>
        <TabsContent value="views">{profile.views && <ViewsPanel views={profile.views} />}</TabsContent>
        <TabsContent value="gates">{profile.gates && <GatesPanel gates={profile.gates} />}</TabsContent>
        <TabsContent value="http_client">{profile.http_client && <HttpClientPanel http={profile.http_client} />}</TabsContent>
        <TabsContent value="logs">{profile.logs && <LogsPanel logs={profile.logs} />}</TabsContent>
        <TabsContent value="jobs">{profile.jobs && <JobsPanel jobs={profile.jobs} />}</TabsContent>
        <TabsContent value="memory">{profile.memory && <MemoryPanel memory={profile.memory} />}</TabsContent>
        <TabsContent value="timing">{profile.timing && <TimingPanel timing={profile.timing} />}</TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Tab list resolver ────────────────────────────────────────────────────────
function buildTabList(p: ProfileV1) {
  const tabs: Array<{ value: string; label: string; badge?: string | number; badgeVariant?: "secondary" | "destructive" | "default" }> = [];
  if (p.request) tabs.push({ value: "request", label: "Request" });
  if (p.route) tabs.push({ value: "route", label: "Route" });
  if (p.queries) {
    tabs.push({
      value: "queries",
      label: "Queries",
      badge: p.queries.total_count,
      badgeVariant: p.queries.slow_count > 0 || p.queries.duplicate_count > 0 ? "destructive" : "secondary",
    });
  }
  if (p.cache) tabs.push({ value: "cache", label: "Cache", badge: p.cache.hits + p.cache.misses + p.cache.writes + p.cache.deletes });
  if (p.mail && p.mail.total_count > 0) tabs.push({ value: "mail", label: "Mail", badge: p.mail.total_count });
  if (p.events && p.events.total_count > 0) tabs.push({ value: "events", label: "Events", badge: p.events.total_count });
  if (p.views && p.views.total_count > 0) tabs.push({ value: "views", label: "Views", badge: p.views.total_count });
  if (p.gates && p.gates.total_count > 0) {
    tabs.push({
      value: "gates",
      label: "Gates",
      badge: p.gates.total_count,
      badgeVariant: p.gates.denied_count > 0 ? "destructive" : "secondary",
    });
  }
  if (p.http_client && p.http_client.total_count > 0) tabs.push({ value: "http_client", label: "HTTP Client", badge: p.http_client.total_count });
  if (p.logs && p.logs.total_count > 0) {
    tabs.push({
      value: "logs",
      label: "Logs",
      badge: p.logs.total_count,
      badgeVariant: p.logs.error_count > 0 ? "destructive" : "secondary",
    });
  }
  if (p.jobs && p.jobs.total_count > 0) tabs.push({ value: "jobs", label: "Jobs", badge: p.jobs.total_count });
  if (p.memory) tabs.push({ value: "memory", label: "Memory" });
  if (p.timing) tabs.push({ value: "timing", label: "Timing" });
  return tabs;
}

// ─── Summary header ───────────────────────────────────────────────────────────
function ProfileSummary({ profile }: { profile: ProfileV1 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <Stat label="Method" value={profile.method ?? "—"} />
      <Stat label="Status" value={String(profile.status_code ?? "—")} accent={(profile.status_code ?? 200) >= 400 ? "danger" : undefined} />
      <Stat label="Duration" value={profile.duration_ms != null ? `${profile.duration_ms.toFixed(0)} ms` : "—"} />
      <Stat label="Token" value={profile.token.slice(0, 8)} mono />
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────
function RequestPanel({ request }: { request: NonNullable<ProfileV1["request"]> }) {
  return (
    <div className="space-y-3 mt-4 text-xs">
      <KvBlock title="Overview">
        <Kv k="Method" v={request.method} />
        <Kv k="URL" v={request.url} mono />
        <Kv k="Path" v={request.path} mono />
        <Kv k="Format" v={request.format} />
        <Kv k="Content-Type" v={request.content_type || "—"} />
        <Kv k="Content-Length" v={String(request.content_length)} />
        <Kv k="Query string" v={request.query_string || "—"} mono />
      </KvBlock>

      <KvBlock title="Headers">
        {Object.entries(request.headers).map(([k, v]) => (
          <Kv key={k} k={k} v={Array.isArray(v) ? v.join(", ") : String(v)} mono />
        ))}
      </KvBlock>

      {request.cookies.length > 0 && (
        <KvBlock title={`Cookies (${request.cookies.length})`}>
          {request.cookies.map((c) => (
            <Kv key={c} k={c} v="(value redacted)" mono />
          ))}
        </KvBlock>
      )}

      {request.session && (
        <KvBlock title="Session">
          <Kv k="ID" v={request.session.id} mono />
          {Object.entries(request.session.data).map(([k, v]) => (
            <Kv key={k} k={k} v={typeof v === "string" ? v : JSON.stringify(v)} mono />
          ))}
        </KvBlock>
      )}
    </div>
  );
}

function RoutePanel({ route }: { route: NonNullable<ProfileV1["route"]> }) {
  return (
    <div className="space-y-3 mt-4 text-xs">
      <KvBlock title="Route">
        <Kv k="URI" v={route.uri} mono />
        <Kv k="Name" v={route.name ?? "—"} />
        <Kv k="Action" v={route.action ?? "—"} mono />
        <Kv k="Controller" v={route.controller ?? "—"} mono />
        <Kv k="Methods" v={route.methods.join(", ")} mono />
        {route.domain && <Kv k="Domain" v={route.domain} />}
        {route.prefix && <Kv k="Prefix" v={route.prefix} mono />}
      </KvBlock>

      {route.middleware.length > 0 && (
        <KvBlock title={`Middleware (${route.middleware.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {route.middleware.map((m) => (
              <Badge key={m} variant="secondary" className="font-mono text-[10px]">{m}</Badge>
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
    <div className="mt-4 space-y-3 text-xs">
      <div className="flex flex-wrap gap-2 text-muted-foreground">
        <StatPill label="Total" value={queries.total_count} />
        <StatPill label="Time" value={`${queries.total_time_ms.toFixed(1)} ms`} />
        <StatPill label="Slow" value={queries.slow_count} tone={queries.slow_count > 0 ? "danger" : "neutral"} />
        <StatPill label="Duplicates" value={queries.duplicate_count} tone={queries.duplicate_count > 0 ? "warn" : "neutral"} />
      </div>
      <ul className="space-y-1">
        {queries.items.map((q, i) => (
          <li key={i} className="rounded border border-dashboard-border bg-card p-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span className="font-mono">{q.connection}</span>
              <span>·</span>
              <span>{q.time_ms.toFixed(2)} ms</span>
              {q.is_slow && <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">slow</Badge>}
              {q.is_duplicate && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">×{q.duplicate_count}</Badge>}
            </div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-foreground">{q.bound_sql}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CachePanel({ cache }: { cache: NonNullable<ProfileV1["cache"]> }) {
  return (
    <div className="mt-4 space-y-3 text-xs">
      <div className="flex flex-wrap gap-2 text-muted-foreground">
        <StatPill label="Hits" value={cache.hits} tone="ok" />
        <StatPill label="Misses" value={cache.misses} />
        <StatPill label="Writes" value={cache.writes} />
        <StatPill label="Deletes" value={cache.deletes} />
        <StatPill label="Hit ratio" value={`${cache.hit_ratio}%`} />
      </div>
      <Table headers={["Type", "Key", "Store"]}>
        {cache.operations.map((op, i) => (
          <tr key={i} className="border-t border-dashboard-border">
            <td className="px-2 py-1">
              <Badge variant={opVariant(op.type)} className="h-4 px-1.5 text-[10px]">{op.type}</Badge>
            </td>
            <td className="px-2 py-1 font-mono">{op.key}</td>
            <td className="px-2 py-1 font-mono text-muted-foreground">{op.store ?? "—"}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function MailPanel({ mail }: { mail: NonNullable<ProfileV1["mail"]> }) {
  return (
    <div className="mt-4 space-y-3 text-xs">
      {mail.messages.map((m, i) => (
        <div key={i} className="rounded border border-dashboard-border bg-card p-2">
          <div className="font-medium">{m.subject || "(no subject)"}</div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
            <Kv k="From" v={m.from.join(", ") || "—"} />
            <Kv k="To" v={m.to.join(", ") || "—"} />
            {m.cc.length > 0 && <Kv k="CC" v={m.cc.join(", ")} />}
            {m.bcc.length > 0 && <Kv k="BCC" v={m.bcc.join(", ")} />}
          </div>
          {m.body_excerpt && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[11px]">{m.body_excerpt}</pre>}
        </div>
      ))}
    </div>
  );
}

function EventsPanel({ events }: { events: NonNullable<ProfileV1["events"]> }) {
  const rows = Object.entries(events.byName).sort((a, b) => b[1].count - a[1].count);
  return (
    <div className="mt-4 text-xs">
      <Table headers={["Event", "Count", "Listeners", "Total ms"]}>
        {rows.map(([name, e]) => (
          <tr key={name} className="border-t border-dashboard-border">
            <td className="px-2 py-1 font-mono break-all">{name}</td>
            <td className="px-2 py-1 tabular-nums">{e.count}</td>
            <td className="px-2 py-1 tabular-nums">{e.listeners}</td>
            <td className="px-2 py-1 tabular-nums">{e.total_duration_ms.toFixed(2)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ViewsPanel({ views }: { views: NonNullable<ProfileV1["views"]> }) {
  return (
    <div className="mt-4 space-y-2 text-xs">
      {views.items.map((v, i) => (
        <div key={i} className="rounded border border-dashboard-border bg-card p-2">
          <div className="font-mono">{v.name}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">{v.path}</div>
          {v.data_keys.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {v.data_keys.map((k) => (
                <Badge key={k} variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">{k}</Badge>
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
    <div className="mt-4 text-xs">
      <div className="mb-2 flex flex-wrap gap-2 text-muted-foreground">
        <StatPill label="Allowed" value={gates.allowed_count} tone="ok" />
        <StatPill label="Denied" value={gates.denied_count} tone={gates.denied_count > 0 ? "danger" : "neutral"} />
      </div>
      <Table headers={["Ability", "Result", "User", "Args"]}>
        {gates.checks.map((c, i) => (
          <tr key={i} className="border-t border-dashboard-border">
            <td className="px-2 py-1 font-mono">{c.ability}</td>
            <td className="px-2 py-1">
              <Badge variant={c.result ? "secondary" : "destructive"} className="h-4 px-1.5 text-[10px]">
                {c.result ? "allow" : "deny"}
              </Badge>
            </td>
            <td className="px-2 py-1 font-mono">{c.user ?? "—"}</td>
            <td className="px-2 py-1 font-mono text-muted-foreground">{c.arguments_classes.join(", ") || "—"}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function HttpClientPanel({ http }: { http: NonNullable<ProfileV1["http_client"]> }) {
  return (
    <div className="mt-4 text-xs">
      <div className="mb-2 flex flex-wrap gap-2 text-muted-foreground">
        <StatPill label="Total" value={http.total_count} />
        <StatPill label="Time" value={`${http.total_duration_ms.toFixed(1)} ms`} />
      </div>
      <Table headers={["Method", "URL", "Status", "ms"]}>
        {http.requests.map((r, i) => (
          <tr key={i} className="border-t border-dashboard-border">
            <td className="px-2 py-1 font-mono">{r.method}</td>
            <td className="px-2 py-1 font-mono break-all">{r.url}</td>
            <td className="px-2 py-1">
              <Badge variant={r.status_code >= 400 ? "destructive" : r.status_code === 0 ? "destructive" : "secondary"} className="h-4 px-1.5 text-[10px]">
                {r.status_code || "fail"}
              </Badge>
            </td>
            <td className="px-2 py-1 tabular-nums">{r.duration_ms.toFixed(1)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function LogsPanel({ logs }: { logs: NonNullable<ProfileV1["logs"]> }) {
  return (
    <div className="mt-4 space-y-1 text-xs">
      <div className="mb-2 flex flex-wrap gap-2 text-muted-foreground">
        {Object.entries(logs.counts_by_level).map(([level, count]) => (
          <StatPill key={level} label={level} value={count} tone={isErrorLevel(level) ? "danger" : "neutral"} />
        ))}
      </div>
      {logs.items.map((l, i) => (
        <div key={i} className="rounded border border-dashboard-border bg-card p-2">
          <div className="flex items-center gap-2">
            <Badge variant={isErrorLevel(l.level) ? "destructive" : "secondary"} className="h-4 px-1.5 text-[10px] uppercase">
              {l.level}
            </Badge>
            <span className="font-mono text-[11px]">{l.message}</span>
          </div>
          {Object.keys(l.context).length > 0 && (
            <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1 text-[10px]">{JSON.stringify(l.context, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

function JobsPanel({ jobs }: { jobs: NonNullable<ProfileV1["jobs"]> }) {
  return (
    <div className="mt-4 text-xs">
      <Table headers={["Queue", "Class", "Status", "ms"]}>
        {jobs.items.map((j, i) => (
          <tr key={i} className="border-t border-dashboard-border">
            <td className="px-2 py-1 font-mono">{j.queue}</td>
            <td className="px-2 py-1 font-mono break-all">{j.class}</td>
            <td className="px-2 py-1">
              <Badge variant={j.status === "failed" ? "destructive" : "secondary"} className="h-4 px-1.5 text-[10px]">{j.status}</Badge>
            </td>
            <td className="px-2 py-1 tabular-nums">{j.duration_ms.toFixed(1)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function MemoryPanel({ memory }: { memory: NonNullable<ProfileV1["memory"]> }) {
  const peakMb = memory.peak_bytes / 1024 / 1024;
  const limitMb = memory.limit_bytes > 0 ? memory.limit_bytes / 1024 / 1024 : null;
  const ratioPct = Math.round(memory.usage_ratio * 100);
  return (
    <div className="mt-4 space-y-2 text-xs">
      <Kv k="Peak" v={`${peakMb.toFixed(1)} MB`} />
      <Kv k="Limit" v={limitMb ? `${limitMb.toFixed(0)} MB` : "no limit"} />
      <Kv k="Usage" v={`${ratioPct}%`} />
      {memory.opcache_mb !== null && <Kv k="Opcache" v={`${memory.opcache_mb} MB`} />}
      {limitMb && (
        <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
          <div className={cn("h-full", ratioPct > 80 ? "bg-destructive" : "bg-foreground")} style={{ width: `${Math.min(ratioPct, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function TimingPanel({ timing }: { timing: NonNullable<ProfileV1["timing"]> }) {
  return (
    <div className="mt-4 space-y-2 text-xs">
      <Kv k="Total duration" v={`${timing.duration_ms.toFixed(1)} ms`} />
      {Object.keys(timing.events).length > 0 && (
        <Table headers={["Event", "Start ms", "Duration ms"]}>
          {Object.entries(timing.events).map(([name, e]) => (
            <tr key={name} className="border-t border-dashboard-border">
              <td className="px-2 py-1 font-mono">{name}</td>
              <td className="px-2 py-1 tabular-nums">{e.start.toFixed(2)}</td>
              <td className="px-2 py-1 tabular-nums">{e.duration.toFixed(2)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────
function KvBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function Kv({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <div className="w-32 shrink-0 text-muted-foreground">{k}</div>
      <div className={cn("min-w-0 break-all text-foreground", mono && "font-mono")}>{v}</div>
    </div>
  );
}

function Stat({ label, value, accent, mono = false }: { label: string; value: string; accent?: "danger"; mono?: boolean }) {
  return (
    <div className="rounded border border-dashboard-border bg-card p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-base font-medium", mono && "font-mono", accent === "danger" && "text-destructive")}>{value}</div>
    </div>
  );
}

function StatPill({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "ok" | "warn" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
        tone === "danger" && "border-destructive/40 text-destructive",
        tone === "warn" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
        tone === "ok" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
        tone === "neutral" && "border-dashboard-border text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </span>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-dashboard-border">
      <table className="min-w-full text-[11px]">
        <thead>
          <tr className="bg-muted">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 text-left font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-3 text-xs text-muted-foreground md:px-8">{children}</p>;
}

function opVariant(type: "hit" | "miss" | "write" | "delete"): "secondary" | "destructive" | "default" {
  if (type === "miss") return "destructive";
  return "secondary";
}

function isErrorLevel(level: string): boolean {
  return ["error", "critical", "alert", "emergency"].includes(level);
}
