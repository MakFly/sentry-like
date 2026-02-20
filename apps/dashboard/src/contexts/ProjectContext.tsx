"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useCurrentOrganization } from "./OrganizationContext";
import { trpc } from "@/lib/trpc/client";

export interface Project {
  id: string;
  slug: string;
  name: string;
  organizationId: string;
  organizationName: string;
  environment: string;
  platform: string;
}

interface ProjectContextType {
  currentProjectSlug: string | null;
  currentProjectId: string | null;
  currentProject: Project | null;
  projects: Project[];
  orgProjects: Project[]; // Projects filtered by current org
  isLoading: boolean;
  refetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

/**
 * Extract project slug from pathname
 * e.g., "/dashboard/my-org/my-project/issues" → "my-project"
 */
function extractProjectSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/[^/]+\/([^/]+)/);
  if (!match) return null;

  const potentialSlug = match[1];

  // These are NOT project slugs - they're legacy routes or special pages
  const reservedPaths = ['issues', 'replays', 'stats', 'settings', 'help'];
  if (reservedPaths.includes(potentialSlug)) {
    return null;
  }

  return potentialSlug;
}

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();
  const { data: projects = [], isLoading, refetch: refetchQuery } = trpc.projects.getAll.useQuery();

  // Derive project slug from URL - always in sync
  const currentProjectSlug = useMemo(() => {
    return extractProjectSlugFromPath(pathname);
  }, [pathname]);

  const refetchProjects = async () => {
    await refetchQuery();
  };

  // Filter projects by current org
  const orgProjects = useMemo(() => {
    if (!currentOrgId) return [];
    return projects.filter(p => p.organizationId === currentOrgId);
  }, [projects, currentOrgId]);

  // Resolve current project from slug
  const currentProject = useMemo(() => {
    if (!currentProjectSlug || !currentOrgId) return null;
    return orgProjects.find(p => p.slug === currentProjectSlug) || null;
  }, [currentProjectSlug, orgProjects, currentOrgId]);

  const currentProjectId = currentProject?.id || null;

  return (
    <ProjectContext.Provider value={{
      currentProjectSlug,
      currentProjectId,
      currentProject,
      projects,
      orgProjects,
      isLoading: isLoading || orgLoading,
      refetchProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useCurrentProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useCurrentProject must be used within ProjectProvider");
  }
  return context;
}
