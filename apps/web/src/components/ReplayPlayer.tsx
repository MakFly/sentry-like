"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  AlertCircle,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  Clock,
  Globe,
  ExternalLink,
} from "lucide-react";

interface RRWebEvent {
  type: number;
  data: unknown;
  timestamp: number;
}

interface ReplayMetadata {
  sessionId: string;
  startedAt: Date | string;
  endedAt: Date | string | null;
  duration: number | null;
  url: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
}

interface ReplayPlayerProps {
  events: RRWebEvent[];
  errorTimestamp?: Date;
  className?: string;
  metadata?: ReplayMetadata;
}

function formatTime(ms: number): string {
  if (ms < 0 || !isFinite(ms)) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

export function ReplayPlayer({
  events,
  errorTimestamp,
  className,
  metadata,
}: ReplayPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Refs for avoiding stale closures and sync issues
  const durationRef = useRef(0);
  const playingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const lastSeekRef = useRef(0); // Timestamp of last seek to prevent race conditions

  // Calculate duration from events as fallback
  const calculatedDuration =
    events.length >= 2
      ? events[events.length - 1].timestamp - events[0].timestamp
      : 0;

  // Keep refs in sync
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Close speed menu on click outside
  useEffect(() => {
    const handleClick = () => setShowSpeedMenu(false);
    if (showSpeedMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showSpeedMenu]);

  // Initialize rrweb-player
  useEffect(() => {
    if (!events || events.length === 0) {
      setError("No replay data available");
      setIsLoading(false);
      return;
    }

    const hasFullSnapshot = events.some((e) => e.type === 2);
    if (!hasFullSnapshot) {
      setError("Invalid replay data: missing initial DOM snapshot");
      setIsLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any = null;
    let animationFrame: number;

    const initPlayer = async () => {
      try {
        const rrwebPlayer = await import("rrweb-player");

        if (!containerRef.current) return;

        if (playerRef.current) {
          try {
            playerRef.current.pause();
          } catch {}
          playerRef.current = null;
        }

        containerRef.current.innerHTML = "";

        player = new rrwebPlayer.default({
          target: containerRef.current,
          props: {
            events,
            width: 960,
            height: 540,
            autoPlay: false,
            showController: false,
            speedOption: [0.5, 1, 2, 4],
            skipInactive: true,
            mouseTail: {
              strokeStyle: "rgba(139, 92, 246, 0.8)",
              lineWidth: 3,
            },
            UNSAFE_replayCanvas: false,
          },
        });

        playerRef.current = player;

        // Get duration
        const meta = player.getMetaData();
        const metaDuration = meta?.totalTime || 0;
        const finalDuration =
          metaDuration > 0 ? metaDuration : calculatedDuration;

        if (finalDuration > 0) {
          durationRef.current = finalDuration;
          setDuration(finalDuration);
        }

        // Reset player to beginning
        try {
          const replayer = player.getReplayer();
          replayer.pause(0);
        } catch {}
        setCurrentTime(0);

        // Time update loop - only update if value actually changed
        let lastReportedTime = 0;
        const updateTime = () => {
          if (playerRef.current) {
            // Skip updates for 150ms after a seek to prevent race conditions
            const timeSinceSeek = Date.now() - lastSeekRef.current;
            if (timeSinceSeek < 150) {
              animationFrame = requestAnimationFrame(updateTime);
              return;
            }

            try {
              const replayer = playerRef.current.getReplayer();
              if (replayer) {
                const time = replayer.getCurrentTime();
                const dur = durationRef.current;

                if (time >= 0 && isFinite(time) && dur > 0) {
                  // Detect end of playback
                  if (playingRef.current && time >= dur - 50) {
                    replayer.pause(dur);
                    playingRef.current = false;
                    setPlaying(false);
                    currentTimeRef.current = dur;
                    setCurrentTime(dur);
                    lastReportedTime = dur;
                  } else {
                    // Only update if changed by more than 16ms (1 frame)
                    const newTime = Math.min(time, dur);
                    if (Math.abs(newTime - lastReportedTime) > 16) {
                      currentTimeRef.current = newTime;
                      setCurrentTime(newTime);
                      lastReportedTime = newTime;
                    }
                  }
                }
              }
            } catch {}
          }
          animationFrame = requestAnimationFrame(updateTime);
        };
        animationFrame = requestAnimationFrame(updateTime);

        // Always start at 0 - user can navigate manually
        // errorTimestamp is used for filtering events, not for auto-seeking
        setCurrentTime(0);

        setIsLoading(false);
        setError(null);
      } catch (e) {
        console.error("Failed to initialize rrweb-player:", e);
        setError("Failed to load replay player");
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (player) {
        try {
          player.pause();
        } catch {}
      }
    };
  }, [events, calculatedDuration]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const replayer = playerRef.current.getReplayer();
      const dur = durationRef.current;
      const time = replayer.getCurrentTime();

      if (playingRef.current) {
        replayer.pause();
        playingRef.current = false;
        setPlaying(false);
      } else {
        // Restart from beginning if at or near the end (within 500ms)
        const isAtEnd = dur > 0 && time >= dur - 500;
        const startTime = isAtEnd ? 0 : time;
        
        // Mark seek time to prevent race condition
        lastSeekRef.current = Date.now();
        
        replayer.play(startTime);
        playingRef.current = true;
        setPlaying(true);
        setCurrentTime(startTime);
      }
    } catch (e) {
      console.error("Play/pause error:", e);
    }
  }, []);

  const restart = useCallback(() => {
    if (!playerRef.current) return;
    try {
      // Mark seek time to prevent race condition
      lastSeekRef.current = Date.now();
      
      const replayer = playerRef.current.getReplayer();
      replayer.pause(0);
      playingRef.current = false;
      setCurrentTime(0);
      setPlaying(false);
    } catch {}
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      const dur = durationRef.current;
      if (!playerRef.current || dur <= 0) return;
      try {
        const replayer = playerRef.current.getReplayer();
        const time = replayer.getCurrentTime();
        const newTime = Math.max(0, Math.min(dur, time + seconds * 1000));
        
        // Mark seek time to prevent race condition
        lastSeekRef.current = Date.now();
        
        if (playingRef.current) {
          replayer.play(newTime);
        } else {
          replayer.pause(newTime);
        }
        setCurrentTime(newTime);
      } catch {}
    },
    []
  );

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      if (!playerRef.current) return;
      setSpeed(newSpeed);
      try {
        const replayer = playerRef.current.getReplayer();
        replayer.setConfig({ speed: newSpeed });
      } catch {}
    },
    []
  );

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const dur = durationRef.current;
      if (!playerRef.current || dur <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const newTime = Math.floor(percent * dur);
      
      // Mark seek time to prevent race condition
      lastSeekRef.current = Date.now();
      
      try {
        const replayer = playerRef.current.getReplayer();
        if (playingRef.current) {
          replayer.play(newTime);
        } else {
          replayer.pause(newTime);
        }
        setCurrentTime(newTime);
      } catch {}
    },
    []
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const dur = durationRef.current;
      if (dur <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      setHoverProgress(percent * dur);
    },
    []
  );

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen error:", e);
    }
  }, []);

  const progress =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const DeviceIcon = getDeviceIcon(metadata?.deviceType || null);

  if (error) {
    return (
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="font-medium text-muted-foreground">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              {events?.length || 0} events loaded
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Player Container */}
      <div
        ref={wrapperRef}
        className={cn(
          "relative overflow-hidden border border-border bg-card",
          isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                playing ? "bg-red-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span className="text-sm font-medium text-foreground">
              Session Replay
            </span>
            <span className="text-muted-foreground">/</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Monitor className="h-4 w-4" />
              {metadata?.browser || "Chrome"}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
              {metadata?.deviceType || "Desktop"}
            </span>
          </div>
        </div>

        {/* Player Viewport */}
        <div
          className="relative aspect-video cursor-pointer bg-muted"
          onClick={!isLoading ? togglePlay : undefined}
        >
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-violet-500/30 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-violet-500 rounded-full animate-spin" />
                </div>
                <span className="text-sm text-muted-foreground">Loading replay...</span>
              </div>
            </div>
          )}

          {/* rrweb container */}
          <div
            ref={containerRef}
            className={cn(
              "flex h-full w-full items-center justify-center [&_.rr-player]:!bg-transparent [&_iframe]:!bg-muted",
              isLoading && "opacity-0"
            )}
          />

          {/* Play overlay when paused */}
          {!playing && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 opacity-0 transition-opacity hover:opacity-100 dark:bg-black/30">
              <div className="w-20 h-20 rounded-full bg-violet-600/90 flex items-center justify-center shadow-xl shadow-violet-900/50">
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div
          className="group relative h-1.5 cursor-pointer bg-muted"
          onClick={seek}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverProgress(null)}
        >
          {/* Progress fill - no transition for instant sync */}
          <div
            className="absolute inset-y-0 left-0 bg-violet-500"
            style={{ width: `${progress}%` }}
          />

          {/* Hover preview tooltip */}
          {hoverProgress !== null && duration > 0 && (
            <div
              className="absolute -top-8 -translate-x-1/2 transform rounded border border-border bg-popover px-2 py-1 font-mono text-xs text-popover-foreground shadow-md"
              style={{ left: `${(hoverProgress / duration) * 100}%` }}
            >
              {formatTime(hoverProgress)}
            </div>
          )}

          {/* Scrubber handle - always visible, no transition for instant sync */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
          {/* Left controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="h-5 w-5 text-foreground" />
              ) : (
                <Play className="ml-0.5 h-5 w-5 text-foreground" />
              )}
            </button>

            <button
              onClick={() => skip(-10)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted"
              title="Rewind 10s"
            >
              <SkipBack className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => skip(10)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted"
              title="Forward 10s"
            >
              <SkipForward className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={restart}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Time display */}
            <div className="ml-3 font-mono text-sm tabular-nums text-muted-foreground">
              <span className="text-foreground">{formatTime(currentTime)}</span>
              <span className="mx-1 text-muted-foreground/70">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                }}
                className="flex h-9 cursor-pointer items-center rounded-lg px-3 transition-colors hover:bg-muted"
                title="Playback speed"
              >
                <span className="text-sm font-medium text-foreground">{speed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 z-50 mb-2 rounded-lg border border-border bg-popover py-1 shadow-xl">
                  {[0.5, 1, 1.5, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeSpeed(s);
                        setShowSpeedMenu(false);
                      }}
                      className={cn(
                        "w-full cursor-pointer px-4 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                        speed === s ? "text-violet-600 dark:text-violet-400" : "text-foreground"
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Cards */}
      {metadata && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Recorded</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(metadata.startedAt)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Duration</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDuration(duration || calculatedDuration)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <DeviceIcon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Device</span>
            </div>
            <p className="text-sm font-medium capitalize text-foreground">
              {metadata.deviceType || "Desktop"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Browser</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {metadata.browser || "Unknown"} / {metadata.os || "Unknown"}
            </p>
          </div>
        </div>
      )}

      {/* URL Card */}
      {metadata?.url && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                Page URL
              </span>
              <code className="truncate font-mono text-sm text-foreground">
                {metadata.url}
              </code>
            </div>
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplayPlayer;
