import { fetchAPI } from './client';
import type {
  WebVitalSummary,
  TransactionsResponse,
  TransactionWithSpans,
  SlowestTransaction,
  PerformanceDateRange,
} from './types';

export const getWebVitals = async (
  projectId: string,
  dateRange?: PerformanceDateRange
): Promise<WebVitalSummary[]> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  if (dateRange) params.set("dateRange", dateRange);
  return fetchAPI<WebVitalSummary[]>(`/performance/web-vitals?${params.toString()}`);
};

export const getTransactions = async (
  projectId: string,
  options?: { op?: string; page?: number; limit?: number }
): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  if (options?.op) params.set("op", options.op);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  return fetchAPI<TransactionsResponse>(`/performance/transactions?${params.toString()}`);
};

export const getTransaction = async (
  transactionId: string
): Promise<TransactionWithSpans> => {
  return fetchAPI<TransactionWithSpans>(`/performance/transactions/${transactionId}`);
};

export const getSlowest = async (
  projectId: string,
  dateRange?: PerformanceDateRange
): Promise<SlowestTransaction[]> => {
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  if (dateRange) params.set("dateRange", dateRange);
  return fetchAPI<SlowestTransaction[]>(`/performance/slowest?${params.toString()}`);
};
