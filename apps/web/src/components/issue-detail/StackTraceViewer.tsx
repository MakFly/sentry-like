"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code2,
  Package,
} from "lucide-react";

interface StackFrame {
  file: string;
  line: number;
  column?: number;
  function: string;
  isVendor: boolean;
}

interface StackTraceViewerProps {
  stack: string;
  highlightFile?: string;
  highlightLine?: number;
  className?: string;
}

function parseStackTrace(stack: string): StackFrame[] {
  const lines = stack.split("\n");
  const frames: StackFrame[] = [];

  // Multiple patterns for different stack trace formats
  const patterns: Array<{ regex: RegExp; groups: { fn?: number; file: number; line: number; col?: number } }> = [
    // Node.js/V8: "at functionName (file:line:col)" or "at file:line:col"
    { regex: /at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):?(\d+)?\)?/, groups: { fn: 1, file: 2, line: 3, col: 4 } },
    // Firefox: "functionName@file:line:col"
    { regex: /^(.+?)@(.+?):(\d+):?(\d+)?$/, groups: { fn: 1, file: 2, line: 3, col: 4 } },
    // Safari: "functionName — file:line"
    { regex: /^(.+?)\s+—\s+(.+?):(\d+)$/, groups: { fn: 1, file: 2, line: 3 } },
    // Chrome async: "async functionName (file:line:col)"
    { regex: /async\s+(.+?)\s+\((.+?):(\d+):?(\d+)?\)/, groups: { fn: 1, file: 2, line: 3, col: 4 } },
    // PHP: "#0 file(line): function()"
    { regex: /#\d+\s+(.+?)\((\d+)\):\s+(.+)/, groups: { file: 1, line: 2, fn: 3 } },
    // Python: "File "file", line N, in function"
    { regex: /File\s+"(.+?)",\s+line\s+(\d+),\s+in\s+(.+)/, groups: { file: 1, line: 2, fn: 3 } },
    // Java/Kotlin: "at package.Class.method(File.java:line)"
    { regex: /at\s+(.+?)\((.+?):(\d+)\)/, groups: { fn: 1, file: 2, line: 3 } },
    // Simple fallback: "file:line:col" or "file:line"
    { regex: /^\s*(.+?):(\d+):?(\d+)?$/, groups: { file: 1, line: 2, col: 3 } },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip error message lines (usually first line)
    if (trimmed.match(/^(\w+Error|\w+Exception):/)) continue;

    for (const { regex, groups } of patterns) {
      const match = trimmed.match(regex);
      if (match) {
        const file = match[groups.file] || "";
        const lineNum = match[groups.line];
        const fn = groups.fn ? match[groups.fn] : undefined;
        const col = groups.col ? match[groups.col] : undefined;

        // Skip if we don't have at least file and line
        if (!file || !lineNum) continue;

        const isVendor = file.includes("node_modules") ||
                         file.includes("vendor") ||
                         file.includes(".min.") ||
                         file.includes("/dist/");

        frames.push({
          file: file
            .replace(/^webpack:\/\/\//, "")
            .replace(/^file:\/\//, "")
            .replace(/\?.+$/, ""),
          line: parseInt(lineNum, 10),
          column: col ? parseInt(col, 10) : undefined,
          function: fn || "(anonymous)",
          isVendor,
        });
        break; // Stop at first matching pattern
      }
    }
  }

  return frames;
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn("p-1.5 rounded hover:bg-muted/20 transition-colors", className)}
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-signal-info" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}

function FrameItem({
  frame,
  index,
  isHighlighted,
  defaultExpanded,
}: {
  frame: StackFrame;
  index: number;
  isHighlighted: boolean;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn(
      "border-b border-issues-border last:border-0",
      isHighlighted && "bg-signal-warning/5"
    )}>
      {/* Frame header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/5 transition-colors",
          isHighlighted && "hover:bg-signal-warning/10"
        )}
      >
        {/* Expand icon */}
        <div className="text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Frame number */}
        <span className={cn(
          "font-mono text-xs font-bold w-5 shrink-0",
          isHighlighted ? "text-signal-warning" : "text-muted-foreground"
        )}>
          {index + 1}
        </span>

        {/* File and location */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-visible">
          <code className="font-mono text-sm text-foreground whitespace-nowrap">
            <span className={isHighlighted ? "text-signal-warning" : "text-signal-info"}>
              {frame.file.split("/").pop()}
            </span>
            <span className="text-muted">:</span>
            <span className={isHighlighted ? "text-signal-warning" : "text-signal-warning/70"}>
              {frame.line}
            </span>
            {frame.column && (
              <>
                <span className="text-muted">:</span>
                <span className="text-muted-foreground">{frame.column}</span>
              </>
            )}
          </code>

          {isHighlighted && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-signal-warning/20 text-signal-warning border border-signal-warning/30">
              source
            </span>
          )}

          {frame.isVendor && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-muted/20 text-muted-foreground border border-issues-border flex items-center gap-1">
              <Package className="h-2.5 w-2.5" />
              vendor
            </span>
          )}
        </div>

        {/* Function name */}
        <code className="font-mono text-xs text-muted-foreground shrink-0 hidden md:block">
          {frame.function}
        </code>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Full path */}
          <div className="flex items-start gap-2 ml-8 overflow-x-visible">
            <code className="font-mono text-xs text-muted-foreground break-all">
              {frame.file}
            </code>
            <CopyButton text={`${frame.file}:${frame.line}`} />
          </div>

          {/* Function info */}
          {frame.function && frame.function !== "(anonymous)" && (
            <div className="ml-8 mt-2">
              <span className="text-xs text-muted-foreground">in </span>
              <code className="font-mono text-xs text-foreground">{frame.function}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StackTraceViewer({
  stack,
  highlightFile,
  highlightLine,
  className,
}: StackTraceViewerProps) {
  const [showVendor, setShowVendor] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const frames = useMemo(() => parseStackTrace(stack), [stack]);
  const displayFrames = showVendor ? frames : frames.filter(f => !f.isVendor);
  const vendorCount = frames.filter(f => f.isVendor).length;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(stack);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "rounded-xl border border-issues-border bg-issues-surface overflow-x-auto",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-issues-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stack Trace
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-muted/10 text-[10px] font-mono text-muted-foreground">
            {displayFrames.length} frames
          </span>
        </div>

        <div className="flex items-center gap-2">
          {vendorCount > 0 && (
            <button
              onClick={() => setShowVendor(!showVendor)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-mono transition-colors",
                showVendor
                  ? "bg-muted/20 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {showVendor ? "Hide" : "Show"} vendor ({vendorCount})
            </button>
          )}

          <button
            onClick={() => setShowRaw(!showRaw)}
            className={cn(
              "px-2 py-1 rounded text-[10px] font-mono transition-colors",
              showRaw
                ? "bg-muted/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {showRaw ? "Parsed" : "Raw"}
          </button>

          <button
            onClick={handleCopyAll}
            className="p-1.5 rounded hover:bg-muted/20 transition-colors"
            title="Copy all"
          >
            {copied ? (
              <Check className="h-4 w-4 text-signal-info" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {showRaw ? (
        <div className="p-4">
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all overflow-x-auto">
            {stack}
          </pre>
        </div>
      ) : (
        <div>
          {displayFrames.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No stack frames found
            </p>
          ) : (
            displayFrames.map((frame, index) => {
              const isHighlighted =
                highlightFile &&
                highlightLine &&
                frame.file.includes(highlightFile) &&
                frame.line === highlightLine;

              return (
                <FrameItem
                  key={`${frame.file}-${frame.line}-${index}`}
                  frame={frame}
                  index={index}
                  isHighlighted={!!isHighlighted}
                  defaultExpanded={index === 0 || !!isHighlighted}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
