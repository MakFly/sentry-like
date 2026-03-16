"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  FileCode2,
} from "lucide-react";

interface StackFrame {
  rawLine: string;
  file: string;
  line: number;
  column?: number;
  function?: string;
  isVendor?: boolean;
}

interface SignalTraceProps {
  stack: string;
  highlightFile?: string;
  highlightLine?: number;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-issues-surface hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-signal-info" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function parseStackTrace(stack: string): StackFrame[] {
  const lines = stack.split("\n").filter(Boolean);
  const frames: StackFrame[] = [];

  for (const rawLine of lines) {
    // Try to parse common stack trace formats
    // Format: "at functionName (file:line:column)"
    // or "at file:line:column"
    // or "functionName@file:line:column" (Firefox)
    const atMatch = rawLine.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):?(\d+)?\)?/);
    const firefoxMatch = rawLine.match(/^(.+?)@(.+?):(\d+):?(\d+)?$/);

    if (atMatch) {
      const [, func, file, lineNum, colNum] = atMatch;
      frames.push({
        rawLine: rawLine.trim(),
        file: file || "unknown",
        line: parseInt(lineNum, 10) || 0,
        column: colNum ? parseInt(colNum, 10) : undefined,
        function: func?.trim() || undefined,
        isVendor: file?.includes("node_modules") || false,
      });
    } else if (firefoxMatch) {
      const [, func, file, lineNum, colNum] = firefoxMatch;
      frames.push({
        rawLine: rawLine.trim(),
        file: file || "unknown",
        line: parseInt(lineNum, 10) || 0,
        column: colNum ? parseInt(colNum, 10) : undefined,
        function: func?.trim() || undefined,
        isVendor: file?.includes("node_modules") || false,
      });
    } else {
      // Fallback: keep raw line, try to extract any file reference
      const fileMatch = rawLine.match(/([^\s(]+\.[jt]sx?):(\d+)/);
      frames.push({
        rawLine: rawLine.trim(),
        file: fileMatch ? fileMatch[1] : rawLine.trim(),
        line: fileMatch ? parseInt(fileMatch[2], 10) : 0,
        isVendor: rawLine.includes("node_modules"),
      });
    }
  }

  return frames;
}

function StackFrameComponent({
  frame,
  index,
  isHighlighted,
  defaultExpanded,
  allFrames,
}: {
  frame: StackFrame;
  index: number;
  isHighlighted: boolean;
  defaultExpanded: boolean;
  allFrames: StackFrame[];
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Extract filename from path
  const fileName = frame.file.split("/").pop() || frame.file;
  const dirPath = frame.file.replace(fileName, "");

  // Get surrounding frames for context
  const contextBefore = allFrames.slice(Math.max(0, index - 2), index);
  const contextAfter = allFrames.slice(index + 1, index + 3);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border transition-colors",
        isHighlighted
          ? "border-pulse-primary/40 bg-pulse-primary/5"
          : "border-issues-border bg-issues-surface/30",
        frame.isVendor && "opacity-60"
      )}
    >
      {/* Frame header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-issues-surface/50"
      >
        {/* Expand icon */}
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Frame number */}
        <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">
          #{index}
        </span>

        {/* Frame indicator */}
        {isHighlighted && (
          <span className="font-mono text-xs font-bold text-pulse-primary">→</span>
        )}

        {/* File icon */}
        <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* File path */}
        <span className="min-w-0 flex-1 truncate font-mono text-sm">
          <span className="text-muted-foreground/60">{dirPath}</span>
          <span className={isHighlighted ? "text-pulse-primary" : "text-foreground"}>
            {fileName}
          </span>
          {frame.line > 0 && (
            <>
              <span className="text-muted-foreground/40">:</span>
              <span className="text-pulse-secondary">{frame.line}</span>
            </>
          )}
          {frame.column && (
            <>
              <span className="text-muted-foreground/40">:</span>
              <span className="text-muted-foreground">{frame.column}</span>
            </>
          )}
        </span>

        {/* Function name */}
        {frame.function && (
          <span className="hidden max-w-[200px] shrink-0 truncate rounded bg-issues-surface px-2 py-0.5 font-mono text-xs text-pulse-muted sm:block">
            {frame.function}
          </span>
        )}

        {/* Vendor badge */}
        {frame.isVendor && (
          <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            vendor
          </span>
        )}
      </button>

      {/* Expanded content - Show raw stack trace lines */}
      {expanded && (
        <div className="border-t border-issues-border bg-issues-bg/50 p-4">
          <pre className="scrollbar-thin overflow-x-auto font-mono text-xs leading-relaxed">
            {/* Context before */}
            {contextBefore.map((ctxFrame, i) => (
              <div key={`before-${i}`} className="flex py-0.5">
                <span className="mr-4 w-6 shrink-0 select-none text-right text-muted-foreground/40">
                  {index - contextBefore.length + i}
                </span>
                <span className="text-muted-foreground/60">{ctxFrame.rawLine}</span>
              </div>
            ))}

            {/* Current frame - highlighted */}
            <div
              className={cn(
                "flex rounded py-0.5",
                isHighlighted ? "bg-pulse-primary/15" : "bg-signal-error/10"
              )}
            >
              <span className="mr-4 w-6 shrink-0 select-none text-right font-bold text-pulse-primary">
                {index}
              </span>
              <span className="text-foreground">{frame.rawLine}</span>
            </div>

            {/* Context after */}
            {contextAfter.map((ctxFrame, i) => (
              <div key={`after-${i}`} className="flex py-0.5">
                <span className="mr-4 w-6 shrink-0 select-none text-right text-muted-foreground/40">
                  {index + 1 + i}
                </span>
                <span className="text-muted-foreground/60">{ctxFrame.rawLine}</span>
              </div>
            ))}
          </pre>

          {/* Frame details */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-issues-border pt-4 text-xs">
            {frame.function && (
              <div>
                <span className="text-muted-foreground">Function: </span>
                <code className="rounded bg-issues-surface px-1.5 py-0.5 text-pulse-primary">
                  {frame.function}
                </code>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">File: </span>
              <code className="rounded bg-issues-surface px-1.5 py-0.5 text-foreground">
                {frame.file}
              </code>
            </div>
            {frame.line > 0 && (
              <div>
                <span className="text-muted-foreground">Line: </span>
                <code className="rounded bg-issues-surface px-1.5 py-0.5 text-pulse-secondary">
                  {frame.line}
                </code>
              </div>
            )}
            {frame.column && (
              <div>
                <span className="text-muted-foreground">Column: </span>
                <code className="rounded bg-issues-surface px-1.5 py-0.5 text-muted-foreground">
                  {frame.column}
                </code>
              </div>
            )}
          </div>

          {/* Copy button for this frame */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => navigator.clipboard.writeText(frame.rawLine)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-issues-surface hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              Copy frame
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SignalTrace({
  stack,
  highlightFile,
  highlightLine,
  className,
}: SignalTraceProps) {
  const [showVendor, setShowVendor] = useState(false);
  const frames = parseStackTrace(stack);

  const appFrames = frames.filter((f) => !f.isVendor);
  const vendorFrames = frames.filter((f) => f.isVendor);

  const displayFrames = showVendor ? frames : appFrames;

  // If no app frames, show all frames
  const finalFrames = displayFrames.length > 0 ? displayFrames : frames;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-pulse-primary" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Signal Trace
          </h3>
          <span className="rounded bg-issues-surface px-2 py-0.5 text-xs text-muted-foreground">
            {frames.length} frames
          </span>
        </div>

        <div className="flex items-center gap-2">
          {vendorFrames.length > 0 && appFrames.length > 0 && (
            <button
              onClick={() => setShowVendor(!showVendor)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                showVendor
                  ? "bg-pulse-primary/10 text-pulse-primary"
                  : "text-muted-foreground hover:bg-issues-surface hover:text-foreground"
              )}
            >
              {showVendor ? "Hide" : "Show"} vendor ({vendorFrames.length})
            </button>
          )}
          <CopyButton text={stack} />
        </div>
      </div>

      {/* Raw stack trace toggle */}
      {frames.length > 0 && (
        <RawStackTrace stack={stack} />
      )}

      {/* Stack frames */}
      <div className="space-y-2">
        {finalFrames.map((frame, index) => {
          const isHighlighted =
            highlightFile && highlightLine
              ? frame.file.includes(highlightFile) && frame.line === highlightLine
              : index === 0;

          return (
            <StackFrameComponent
              key={`${frame.file}-${frame.line}-${index}`}
              frame={frame}
              index={index}
              isHighlighted={isHighlighted}
              defaultExpanded={index === 0 || isHighlighted}
              allFrames={finalFrames}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {frames.length === 0 && (
        <div className="rounded-lg border border-issues-border bg-issues-surface/30 p-8 text-center">
          <Terminal className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No stack trace available
          </p>
        </div>
      )}
    </div>
  );
}

// Raw stack trace collapsible section
function RawStackTrace({ stack }: { stack: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-issues-border bg-issues-surface/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-issues-surface/50"
      >
        <span className="text-xs font-medium text-muted-foreground">
          Raw Stack Trace
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-issues-border bg-issues-bg/50 p-4">
          <div className="mb-2 flex justify-end">
            <CopyButton text={stack} />
          </div>
          <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap break-all rounded bg-issues-bg p-3 font-mono text-xs text-muted-foreground">
            {stack}
          </pre>
        </div>
      )}
    </div>
  );
}
