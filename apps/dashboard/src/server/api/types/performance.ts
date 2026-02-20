export type PerformanceDateRange = "24h" | "7d" | "30d";

export type WebVitalSummary = {
  name: string;
  avg: number;
  p50: number;
  p75: number;
  p95: number;
  count: number;
  status: "good" | "needs-improvement" | "poor";
  threshold: { good: number; needsImprovement: number } | null;
};

export type Transaction = {
  id: string;
  projectId: string;
  name: string;
  op: string;
  traceId: string | null;
  parentSpanId: string | null;
  status: string | null;
  duration: number;
  startTimestamp: Date;
  endTimestamp: Date;
  tags: string | null;
  data: string | null;
  env: string;
  createdAt: Date;
};

export type Span = {
  id: string;
  transactionId: string;
  parentSpanId: string | null;
  op: string;
  description: string | null;
  status: string | null;
  duration: number;
  startTimestamp: Date;
  endTimestamp: Date;
  data: string | null;
};

export type TransactionWithSpans = Transaction & {
  spans: Span[];
};

export type TransactionsResponse = {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SlowestTransaction = {
  name: string;
  op: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
};
