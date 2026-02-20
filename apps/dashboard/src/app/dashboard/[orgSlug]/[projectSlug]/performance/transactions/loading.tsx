import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Breadcrumb */}
      <Skeleton className="h-5 w-48" />

      {/* Header */}
      <Skeleton className="h-8 w-40" />

      {/* Tabs */}
      <Skeleton className="h-10 w-64" />

      {/* Table */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
