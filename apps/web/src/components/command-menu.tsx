"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bug,
  BarChart3,
  Film,
  Settings,
  HelpCircle,
  FileText,
  Zap,
  Search,
  Plus,
  User,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { trpc } from "@/lib/trpc/client";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentProjectSlug } = useCurrentProject();
  const { currentOrgSlug } = useCurrentOrganization();
  const { data: session } = trpc.auth.getSession.useQuery();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  const baseUrl = currentOrgSlug && currentProjectSlug
    ? `/dashboard/${currentOrgSlug}/${currentProjectSlug}`
    : "/dashboard";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-[280px]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-50">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {currentOrgSlug && currentProjectSlug && (
            <>
              <CommandGroup heading="Navigation">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}`))
                  }
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                  <CommandShortcut>⌘D</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}/issues`))
                  }
                >
                  <Bug className="mr-2 h-4 w-4" />
                  <span>Issues</span>
                  <CommandShortcut>⌘I</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}/replays`))
                  }
                >
                  <Film className="mr-2 h-4 w-4" />
                  <span>Replays</span>
                  <CommandShortcut>⌘R</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}/stats`))
                  }
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Statistics</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}/settings`))
                  }
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Help">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${baseUrl}/help`))
                  }
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help Center</span>
                  <CommandShortcut>?</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => window.open("https://ui.shadcn.com/docs/components/command", "_blank"))
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Documentation</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard"))
              }
            >
              <Zap className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard"))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Project</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {session?.user && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{session.user.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {session.user.email}
                  </span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
