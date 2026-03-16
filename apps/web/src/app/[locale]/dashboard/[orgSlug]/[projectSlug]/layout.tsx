import { ReactNode } from "react";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}

/**
 * Project layout - validates projectSlug exists
 * The actual project validation happens in ProjectContext
 * This layout just passes through for now
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  // Await params (Next.js 15 requirement)
  const { orgSlug, projectSlug } = await params;

  return <>{children}</>;
}
