"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { CommandMenu } from "@/components/command-menu";
import { DevResetButton } from "@/components/dev-reset-button";

function getPageTitle(pathname: string, orgSlug: string | null): string {
  if (!orgSlug) return "Dashboard";

  const basePath = `/dashboard/${orgSlug}`;
  const relativePath = pathname.replace(basePath, "");

  if (relativePath === "" || relativePath === "/") return "Overview";
  if (relativePath.startsWith("/issues/")) return "Issue Details";
  if (relativePath === "/issues") return "Issues";
  if (relativePath.startsWith("/replays/")) return "Replay";
  if (relativePath === "/replays") return "Replays";
  if (relativePath === "/stats") return "Statistics";
  if (relativePath === "/help") return "Help";
  if (relativePath.startsWith("/settings")) return "Settings";

  return "Dashboard";
}

function getBreadcrumbs(
  pathname: string,
  orgSlug: string | null
): Array<{ label: string; href?: string }> {
  if (!orgSlug) {
    return [{ label: "Dashboard" }];
  }

  const basePath = `/dashboard/${orgSlug}`;
  const relativePath = pathname.replace(basePath, "");
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Dashboard", href: basePath },
  ];

  if (relativePath === "" || relativePath === "/") {
    return [{ label: "Overview" }];
  }

  if (relativePath.startsWith("/issues")) {
    crumbs.push({ label: "Issues", href: `${basePath}/issues` });

    // Check if we're on a specific issue
    const issueMatch = relativePath.match(/^\/issues\/([^/]+)/);
    if (issueMatch) {
      crumbs.push({ label: `#${issueMatch[1].slice(0, 8)}` });
    }
  } else if (relativePath.startsWith("/replays")) {
    crumbs.push({ label: "Replays", href: `${basePath}/replays` });

    const replayMatch = relativePath.match(/^\/replays\/([^/]+)/);
    if (replayMatch) {
      crumbs.push({ label: `Session` });
    }
  } else if (relativePath === "/stats") {
    crumbs.push({ label: "Statistics" });
  } else if (relativePath === "/help") {
    crumbs.push({ label: "Help" });
  } else if (relativePath.startsWith("/settings")) {
    crumbs.push({ label: "Settings" });
  }

  return crumbs;
}

export function ErrorWatchHeader() {
  const pathname = usePathname();
  const { currentOrgSlug } = useCurrentOrganization();
  const pageTitle = getPageTitle(pathname, currentOrgSlug);
  const breadcrumbs = getBreadcrumbs(pathname, currentOrgSlug);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear md:group-has-[[data-variant=inset]]/sidebar-wrapper:rounded-t-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href && index < breadcrumbs.length - 1 ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side items */}
        <div className="ml-auto flex items-center gap-2">
          {/* Dev-only reset button */}
          <DevResetButton />

          {/* Search Command */}
          <CommandMenu />
        </div>
      </div>
    </header>
  );
}
