import { Skeleton } from "@/components/ui/skeleton";

export default function IssueDetailLoading() {
  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6 lg:p-8 space-y-6">
      {/* Back link */}
      <Skeleton className="h-5 w-24" />

      {/* Header */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Occurrence chart */}
      <Skeleton className="h-32 rounded-xl" />

      {/* Event timeline */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Stack trace */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
