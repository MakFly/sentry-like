"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, BarChart3, Settings, Zap, X, LogOut, Film } from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";

function SidebarNavigation({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const navigation = [
    { name: "Dashboard", href: `/dashboard/${orgSlug}`, icon: BarChart3 },
    { name: "Issues", href: `/dashboard/${orgSlug}/issues`, icon: Bug },
    { name: "Replays", href: `/dashboard/${orgSlug}/replays`, icon: Film },
    { name: "Stats", href: `/dashboard/${orgSlug}/stats`, icon: BarChart3 },
  ];

  const secondaryNav = [
    { name: "Settings", href: `/dashboard/${orgSlug}/settings`, icon: Settings },
  ];

  return (
    <>
      {/* Main navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Monitor
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="my-6 border-t border-border/50" />

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
        {secondaryNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

// Fallback navigation when no project is selected
const fallbackNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Issues", href: "/dashboard", icon: Bug },
  { name: "Replays", href: "/dashboard", icon: Film },
  { name: "Stats", href: "/dashboard", icon: BarChart3 },
];

const fallbackSecondaryNav = [
  { name: "Settings", href: "/dashboard", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const { currentOrgSlug } = useCurrentOrganization();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button for mobile */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">ErrorWatch</h1>
              <p className="text-[10px] font-medium text-muted-foreground">
                Monitoring
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Logo - Desktop only */}
        <div className="hidden lg:flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ErrorWatch</h1>
            <p className="text-[10px] font-medium text-muted-foreground">
              Monitoring
            </p>
          </div>
        </div>

      {/* Project Selector */}
      <div className="border-b border-border/50 p-4">
        <ProjectSelector />
      </div>

      {/* Main navigation */}
      {currentOrgSlug ? (
        <SidebarNavigation orgSlug={currentOrgSlug} />
      ) : (
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monitor
          </p>
          {fallbackNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground/50 cursor-not-allowed pointer-events-none"
            >
              <item.icon className="h-4 w-4 text-muted-foreground/50" />
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="my-6 border-t border-border/50" />

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
          {fallbackSecondaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground/50 cursor-not-allowed pointer-events-none"
            >
              <item.icon className="h-4 w-4 text-muted-foreground/50" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Logout button */}
      <div className="border-t border-border/50 p-4">
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => {
            window.location.href = "/login";
          } } })}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4 transition-colors group-hover:text-destructive" />
          <span>Logout</span>
        </button>
      </div>

      {/* Status indicator */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium text-emerald-400">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
