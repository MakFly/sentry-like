"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const orgsFetched = useRef(false);

  // Derive slug from URL - always in sync
  const currentOrgSlug = useMemo(() => {
    return extractOrgSlugFromPath(pathname);
  }, [pathname]);

  // Fetch organizations function
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/organizations.getAll?input={}");
      const data = await res.json();
      const orgsList = data?.result?.data?.json || [];
      console.log('[OrganizationContext] Fetched orgs:', orgsList.map((o: Organization) => ({ id: o.id, slug: o.slug })));
      setOrganizations(orgsList);
    } catch (err) {
      console.error('[OrganizationContext] Error fetching orgs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch function exposed to consumers
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  // Initial fetch
  useEffect(() => {
    if (orgsFetched.current) return;
    orgsFetched.current = true;
    fetchOrganizations();
  }, [fetchOrganizations]);

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
