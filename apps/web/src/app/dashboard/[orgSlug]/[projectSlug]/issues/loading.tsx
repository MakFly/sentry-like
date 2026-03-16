import { Skeleton } from "@/components/ui/skeleton";

export default function IssuesLoading() {
  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6">
      {/* Header */}
      <Skeleton className="h-10 w-64 mb-4" />

      {/* Severity bar */}
      <Skeleton className="h-8 rounded-lg mb-6" />

      {/* Filters row */}
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
