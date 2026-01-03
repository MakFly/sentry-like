"use client";

import { Menu, Zap } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export default function MobileHeader() {
  const { toggle } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-xl lg:hidden px-4">
      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">ErrorWatch</h1>
        </div>
      </div>
    </header>
  );
}

