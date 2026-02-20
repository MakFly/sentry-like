import { Skeleton } from "@/components/ui/skeleton";

export default function QueriesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Breadcrumb */}
      <Skeleton className="h-5 w-48" />

      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Query insights */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Endpoint impact */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
