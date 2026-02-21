"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useLogsTail } from "@/lib/trpc/hooks";
import type { ApplicationLog, LogLevel } from "@/server/api";
import type { LiveLogEvent } from "@/hooks/useSSE";
import { useSSEStatus } from "@/components/sse-provider";
import { Pause, Play, RefreshCw } from "lucide-react";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "text-slate-400",
  info: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-rose-400",
};

export default function LogsPage() {
  const { currentProjectId } = useCurrentProject();
  const sseStatus = useSSEStatus();
  const [level, setLevel] = useState<LogLevel | "all">("all");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);
  const [liveEntries, setLiveEntries] = useState<ApplicationLog[]>([]);
  const [sampledDrops, setSampledDrops] = useState(0);

  const terminalRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, refetch } = useLogsTail(currentProjectId || "", {
    limit: 150,
    level: level === "all" ? undefined : level,
    channel: channel || undefined,
    search: search || undefined,
    enabled: !!currentProjectId,
  });

  const mergedEntries = useMemo(() => {
    const byId = new Map<string, ApplicationLog>();

    for (const item of liveEntries) byId.set(item.id, item);
    for (const item of data?.items ?? []) byId.set(item.id, item);

    return Array.from(byId.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 500);
  }, [liveEntries, data?.items]);

  useEffect(() => {
    if (!paused && terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [mergedEntries, paused]);

  const onLiveLog = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<LiveLogEvent>;
    const payload = customEvent.detail;

    if (!payload || payload.type !== "log:new" || paused) return;
    if (!currentProjectId || payload.projectId !== currentProjectId) return;

    const liveLog = payload.payload.log;
    if (!liveLog) return;

    if (payload.payload.sampled) {
      setSampledDrops((value) => value + 1);
    }

    const normalized: ApplicationLog = {
      id: liveLog.id,
      projectId: currentProjectId,
      createdAt: new Date(liveLog.timestamp),
      level: liveLog.level,
      channel: liveLog.channel,
      message: liveLog.message,
      context: null,
      extra: null,
      env: liveLog.env ?? null,
      release: liveLog.release ?? null,
      source: liveLog.source,
      url: null,
      requestId: null,
      userId: null,
      ingestedAt: new Date(liveLog.timestamp),
    };

    setLiveEntries((previous) => [normalized, ...previous].slice(0, 300));
  }, [currentProjectId, paused]);

  useEffect(() => {
    window.addEventListener("errorwatch:log:new", onLiveLog as EventListener);
    return () => window.removeEventListener("errorwatch:log:new", onLiveLog as EventListener);
  }, [onLiveLog]);

  const channels = useMemo(() => {
    const unique = new Set(mergedEntries.map((entry) => entry.channel));
    return Array.from(unique).sort();
  }, [mergedEntries]);

  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-4 font-mono text-lg font-semibold text-foreground">Live Logs</h1>
        <span className={`rounded px-2 py-1 text-xs ${sseStatus === "connected" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
          {sseStatus === "connected" ? "Live" : "Reconnecting"}
        </span>
        <span className="rounded bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          sampled drops: {sampledDrops}
        </span>
        <button
          onClick={() => setPaused((p) => !p)}
          className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => {
            setLiveEntries([]);
            refetch();
          }}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <select
          className="rounded border border-border bg-background px-2 py-2 text-sm"
          value={level}
          onChange={(e) => {
            setLiveEntries([]);
            setLevel(e.target.value as LogLevel | "all");
          }}
        >
          <option value="all">All levels</option>
          <option value="debug">debug</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>
        <select
          className="rounded border border-border bg-background px-2 py-2 text-sm"
          value={channel}
          onChange={(e) => {
            setLiveEntries([]);
            setChannel(e.target.value);
          }}
        >
          <option value="">All channels</option>
          {channels.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input
          className="rounded border border-border bg-background px-2 py-2 text-sm md:col-span-2"
          placeholder="Search message"
          value={search}
          onChange={(e) => {
            setLiveEntries([]);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div
        ref={terminalRef}
        className="h-[68vh] overflow-auto rounded-lg border border-border bg-[#0b0f14] p-3 font-mono text-xs leading-5"
      >
        {isLoading && mergedEntries.length === 0 ? (
          <div className="text-muted-foreground">Loading logs...</div>
        ) : mergedEntries.length === 0 ? (
          <div className="text-muted-foreground">No logs in current filter.</div>
        ) : (
          mergedEntries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[170px_80px_130px_1fr] gap-3 border-b border-white/5 py-1">
              <span className="text-slate-500">{new Date(entry.createdAt).toISOString()}</span>
              <span className={LEVEL_COLORS[entry.level]}>{entry.level}</span>
              <span className="text-cyan-400">{entry.channel}</span>
              <span className="text-slate-200 break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
