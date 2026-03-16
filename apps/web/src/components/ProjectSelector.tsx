"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Layers, ChevronDown, Plus, Check, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { UpgradeModal } from "./UpgradeModal";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { getPlatformIcon } from "@/lib/platform-icons";

export function ProjectSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { currentProjectId, currentProject, currentProjectSlug, orgProjects, refetchProjects, isLoading: projectsLoading } = useCurrentProject();
  const { currentOrgSlug, isLoading: orgsLoading } = useCurrentOrganization();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: canCreateResult } = trpc.projects.canCreate.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  const isLoading = projectsLoading || orgsLoading;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleProjectSelect = (project: { id: string; slug: string; name: string; environment?: string }) => {
    setIsOpen(false);
    if (currentOrgSlug) {
      router.push(`/dashboard/${currentOrgSlug}/${project.slug}`);
    }
  };

  const handleCreateClick = () => {
    setIsOpen(false);

    if (!canCreateResult) return;

    if (canCreateResult.allowed) {
      setShowCreateDialog(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleProjectCreated = async () => {
    // Refetch to get the new project, then navigate to it
    await refetchProjects();
    // The CreateProjectDialog will handle navigation to the new project
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary"
        >
          {currentProject ? (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-orange-600 text-[8px] font-bold text-white">
                {getPlatformIcon(currentProject.platform as string) || currentProject.name?.substring(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 truncate text-sm font-medium">{currentProject.name}</span>
            </>
          ) : (
            <>
              <Layers className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {orgProjects.length > 0 ? "Select project" : "No projects"}
              </span>
            </>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border/50 bg-popover shadow-lg">
            <div className="max-h-64 overflow-y-auto p-1">
              {orgProjects.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No projects yet
                </p>
              ) : (
                orgProjects.map((project) => {
                  const isSelected = project.slug === currentProjectSlug;
                  const PlatformIcon = getPlatformIcon(project.platform);
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-orange-600 text-[8px] font-bold text-white">
                        {PlatformIcon || project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{project.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{project.environment}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-border/50 p-1">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-primary/10"
                onClick={handleCreateClick}
              >
                <Plus className="h-4 w-4" />
                <span>New project</span>
                {canCreateResult && !canCreateResult.allowed && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
                    <Crown className="h-3 w-3" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
      />

      {canCreateResult && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={canCreateResult.plan}
          currentCount={canCreateResult.currentCount}
          maxItems={canCreateResult.maxProjects}
          resourceType="project"
        />
      )}
    </>
  );
}
