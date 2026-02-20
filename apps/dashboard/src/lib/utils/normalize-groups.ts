export function normalizeGroups<T = unknown>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return (data as any).groups ?? [];
}
