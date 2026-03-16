import { cookies } from "next/headers";

export async function getCurrentProjectId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("errorwatch_current_project")?.value || null;
  } catch {
    return null;
  }
}
