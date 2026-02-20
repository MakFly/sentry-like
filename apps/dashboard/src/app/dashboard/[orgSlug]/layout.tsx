import { getServerCaller } from "@/server/trpc/router";
import { notFound } from "next/navigation";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  try {
    const caller = await getServerCaller();
    const organizations = await caller.organizations.getAll();
    const organization = organizations.find((o) => o.slug === orgSlug);

    if (!organization) {
      console.error(`[OrgLayout] Organization not found for slug: ${orgSlug}`);
      return notFound();
    }

    return <>{children}</>;
  } catch (error) {
    console.error(`[OrgLayout] Error:`, error);
    return notFound();
  }
}
