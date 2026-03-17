import { Skeleton } from "@/components/ui/skeleton";

export default function InfrastructureLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Controls: host selector + date range */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[220px] rounded-md" />
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>

      {/* Charts Row 1: CPU | Memory */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[310px] rounded-xl" />
        <Skeleton className="h-[310px] rounded-xl" />
      </div>

      {/* Charts Row 2: Network | Disk */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[310px] rounded-xl" />
        <Skeleton className="h-[310px] rounded-xl" />
      </div>
    </div>
  );
}
