"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { TransactionDetail } from "@/components/performance";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-dashboard-surface/50" />
      <div className="h-48 animate-pulse rounded-xl bg-dashboard-surface/50" />
      <div className="h-64 animate-pulse rounded-xl bg-dashboard-surface/50" />
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;
  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;

  const { data: transaction, isLoading } =
    trpc.performance.getTransaction.useQuery(
      { transactionId },
      { enabled: !!transactionId }
    );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!transaction) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Transaction not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`${baseUrl}/performance`}>Performance</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`${baseUrl}/performance/transactions`}>Transactions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{transaction.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`${baseUrl}/performance/transactions`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Transactions
        </Button>
      </div>

      <TransactionDetail transaction={transaction} />
    </div>
  );
}
