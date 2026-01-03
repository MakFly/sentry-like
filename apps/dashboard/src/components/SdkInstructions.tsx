"use client";

import { useState } from "react";
import { Check, Copy, Terminal, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SdkInstructions as SdkInstructionsType } from "@/server/api";

interface SdkInstructionsProps {
  instructions: SdkInstructionsType;
  apiKey: string;
  className?: string;
}

function CodeBlock({
  code,
  language,
  title,
  icon: Icon,
}: {
  code: string;
  language: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground/70">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
            copied
              ? "text-green-500"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-sm font-mono text-foreground/90">{code.trim()}</code>
      </pre>
    </div>
  );
}

export function SdkInstructions({ instructions, apiKey, className }: SdkInstructionsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-xl">
          {instructions.icon === "nextjs" && "▲"}
          {instructions.icon === "nuxt" && "◆"}
          {instructions.icon === "react" && "⚛"}
          {instructions.icon === "vue" && "◇"}
          {instructions.icon === "nodejs" && "⬢"}
          {instructions.icon === "hono" && "🔥"}
          {instructions.icon === "fastify" && "⚡"}
          {instructions.icon === "symfony" && "♪"}
          {instructions.icon === "laravel" && "◈"}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Setup {instructions.name}</h3>
          <p className="text-sm text-muted-foreground">
            Install the SDK and configure your project
          </p>
        </div>
      </div>

      {/* Step 1: Install */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            1
          </span>
          <span className="text-sm font-medium">Install the package</span>
        </div>
        <CodeBlock
          code={instructions.installCommand}
          language={instructions.category === "php" ? "bash" : "bash"}
          title="Terminal"
          icon={Terminal}
        />
      </div>

      {/* Step 2: Configure */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            2
          </span>
          <span className="text-sm font-medium">Configure your app</span>
        </div>
        <CodeBlock
          code={instructions.configSnippet}
          language={instructions.category === "php" ? "yaml" : "typescript"}
          title="Configuration"
          icon={FileCode}
        />
      </div>

      {/* API Key reminder */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-500">🔑</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-amber-200">Your API Key</h4>
            <p className="text-xs text-amber-300/70 mt-0.5 mb-2">
              Keep this key secure. It&apos;s used to authenticate your error reports.
            </p>
            <code className="block px-3 py-2 rounded bg-black/30 text-xs font-mono text-amber-100 break-all">
              {apiKey}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
