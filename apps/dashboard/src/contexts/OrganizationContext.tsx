"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
}

interface OrganizationContextType {
  currentOrgId: string | null;
  currentOrgSlug: string | null;
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

/**
 * Extract organization slug from pathname
 * e.g., "/dashboard/my-company/issues" → "my-company"
 */
function extractOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  if (!match || match[1] === "_") return null;
  return match[1];
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: organizations = [], isLoading, refetch: refetchOrgs } = trpc.organizations.getAll.useQuery();

  // Derive slug from URL - always in sync
  const currentOrgSlug = useMemo(() => {
    return extractOrgSlugFromPath(pathname);
  }, [pathname]);

  const refetch = async () => {
    await refetchOrgs();
  };

  // Resolve org from slug
  const currentOrganization = useMemo(() => {
    if (!currentOrgSlug || organizations.length === 0) return null;
    return organizations.find(o => o.slug === currentOrgSlug) || null;
  }, [currentOrgSlug, organizations]);

  const currentOrgId = currentOrganization?.id || null;

  return (
    <OrganizationContext.Provider value={{ currentOrgId, currentOrgSlug, currentOrganization, organizations, isLoading, refetch }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useCurrentOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useCurrentOrganization must be used within OrganizationProvider");
  }
  return context;
}
