import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Health Strip */}
      <Skeleton className="h-12 rounded-xl" />

      {/* Status Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Pulse + Environments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Severity Chart */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Attention Queue */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
