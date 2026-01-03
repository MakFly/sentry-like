import { getServerCaller } from "@/server/trpc/router";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  // Debug: log cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log(`[OrgLayout] Cookies available:`, allCookies.map(c => c.name));

  try {
    const caller = await getServerCaller();
    console.log(`[OrgLayout] Caller created, fetching organizations...`);

    const organizations = await caller.organizations.getAll();
    console.log(`[OrgLayout] Organizations fetched:`, organizations.map(o => o.slug));

    const organization = organizations.find((o) => o.slug === orgSlug);

    if (!organization) {
      console.error(`[OrgLayout] Organization not found for slug: ${orgSlug}`);
      return notFound();
    }

    console.log(`[OrgLayout] Organization found: ${organization.name}`);
    return <>{children}</>;
  } catch (error) {
    console.error(`[OrgLayout] Error:`, error);
    return notFound();
  }
}
