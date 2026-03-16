"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { NoProjectDashboard } from "@/components/NoProjectDashboard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Organization page - handles empty state (no projects)
 * If projects exist, redirects to first project
 */
export default function OrgDashboardPage() {
  const router = useRouter();
  const { currentOrgSlug, isLoading: orgLoading } = useCurrentOrganization();
  const { orgProjects, isLoading: projectsLoading } = useCurrentProject();

  const isLoading = orgLoading || projectsLoading;

  useEffect(() => {
    // Wait for data to load
    if (isLoading) return;

    // If there are projects, redirect to the first one
    if (orgProjects.length > 0 && currentOrgSlug) {
      const firstProject = orgProjects[0];
      router.replace(`/dashboard/${currentOrgSlug}/${firstProject.slug}`);
    }
  }, [isLoading, orgProjects, currentOrgSlug, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // No projects - show empty state
  if (orgProjects.length === 0) {
    return <NoProjectDashboard />;
  }

  // Redirecting to first project...
  return (
    <div className="flex flex-1 items-center justify-center">
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
