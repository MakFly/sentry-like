"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  BarChart3,
  Gauge,
  Settings,
  Film,
  HelpCircle,
  Zap,
  LayoutDashboard,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { ProjectSelector } from "@/components/ProjectSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { useSSEStatus } from "@/components/sse-provider";

export function ErrorWatchSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const pathname = usePathname();
  const sseStatus = useSSEStatus();

  // Build navigation items based on current org AND project
  const navMain = React.useMemo(() => {
    if (!currentOrgSlug) {
      return [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/dashboard",
        },
      ];
    }

    // If no project selected, point to org-level (will show empty state)
    if (!currentProjectSlug) {
      const orgUrl = `/dashboard/${currentOrgSlug}`;
      return [
        {
          title: "Dashboard",
          url: orgUrl,
          icon: LayoutDashboard,
          isActive: pathname === orgUrl,
        },
      ];
    }

    const baseUrl = `/dashboard/${currentOrgSlug}/${currentProjectSlug}`;
    return [
      {
        title: "Dashboard",
        url: baseUrl,
        icon: LayoutDashboard,
        isActive: pathname === baseUrl,
      },
      {
        title: "Issues",
        url: `${baseUrl}/issues`,
        icon: Bug,
        isActive: pathname.startsWith(`${baseUrl}/issues`),
      },
      {
        title: "Replays",
        url: `${baseUrl}/replays`,
        icon: Film,
        isActive: pathname.startsWith(`${baseUrl}/replays`),
      },
      {
        title: "Stats",
        url: `${baseUrl}/stats`,
        icon: BarChart3,
        isActive: pathname.startsWith(`${baseUrl}/stats`),
      },
      {
        title: "Performance",
        url: `${baseUrl}/performance`,
        icon: Gauge,
        isActive: pathname.startsWith(`${baseUrl}/performance`),
      },
    ];
  }, [currentOrgSlug, currentProjectSlug, pathname]);

  const navSecondary = React.useMemo(() => {
    // Settings and Help require project context
    if (!currentOrgSlug || !currentProjectSlug) {
      return [];
    }
    const baseUrl = `/dashboard/${currentOrgSlug}/${currentProjectSlug}`;
    return [
      {
        title: "Settings",
        url: `${baseUrl}/settings`,
        icon: Settings,
      },
      {
        title: "Help",
        url: `${baseUrl}/help`,
        icon: HelpCircle,
      },
    ];
  }, [currentOrgSlug, currentProjectSlug]);

  const user = React.useMemo(
    () => ({
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? "",
      image: session?.user?.image ?? null,
    }),
    [session]
  );

  const loading = sessionLoading || !session?.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight">
                    ErrorWatch
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Monitoring
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Organization & Project Selectors */}
        <div className="space-y-1 px-2 py-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organization
          </p>
          <OrganizationSwitcher />
        </div>

        <div className="space-y-1 px-2 pb-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </p>
          <ProjectSelector />
        </div>

        <SidebarSeparator />

        <NavMain items={navMain} />

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        {/* Live Status */}
        <div className="px-2 pb-2">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            sseStatus === "connected"
              ? "bg-emerald-500/10"
              : sseStatus === "connecting"
                ? "bg-amber-500/10"
                : "bg-muted/50"
          }`}>
            <span className="relative flex h-2 w-2">
              {sseStatus === "connected" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${
                sseStatus === "connected"
                  ? "bg-emerald-500"
                  : sseStatus === "connecting"
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
              }`} />
            </span>
            <span className={`text-xs font-medium ${
              sseStatus === "connected"
                ? "text-emerald-400"
                : sseStatus === "connecting"
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }`}>
              {sseStatus === "connected"
                ? "Live"
                : sseStatus === "connecting"
                  ? "Reconnecting..."
                  : "Offline"}
            </span>
          </div>
        </div>

        <NavUser user={user} loading={loading} />
      </SidebarFooter>
    </Sidebar>
  );
}
