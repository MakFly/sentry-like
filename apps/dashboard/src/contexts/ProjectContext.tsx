"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCurrentOrganization } from "./OrganizationContext";

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
  // Match /dashboard/[orgSlug]/[projectSlug]/...
  // Exclude special paths like "issues", "replays", "stats", "settings", "help" at orgSlug position
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
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const projectsFetched = useRef(false);

  // Derive project slug from URL - always in sync
  const currentProjectSlug = useMemo(() => {
    return extractProjectSlugFromPath(pathname);
  }, [pathname]);

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/projects.getAll?input={}");
      const data = await res.json();
      const projectsList = data?.result?.data?.json || [];
      console.log('[ProjectContext] Fetched projects:', projectsList.map((p: Project) => ({ id: p.id, slug: p.slug, name: p.name, orgId: p.organizationId })));
      setProjects(projectsList);
      setIsLoading(false);
      return projectsList;
    } catch (err) {
      console.error('[ProjectContext] Error fetching projects:', err);
      setIsLoading(false);
      return [];
    }
  }, []);

  // Refetch function exposed to consumers
  const refetchProjects = useCallback(async () => {
    setIsLoading(true);
    await fetchProjects();
  }, [fetchProjects]);

  // Initial fetch
  useEffect(() => {
    if (projectsFetched.current) return;
    projectsFetched.current = true;
    fetchProjects();
  }, [fetchProjects]);

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

  // Resolve current project ID from slug
  const currentProjectId = useMemo(() => {
    return currentProject?.id || null;
  }, [currentProject]);

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
