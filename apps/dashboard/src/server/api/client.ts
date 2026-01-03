/**
 * REST API client utilities
 * Using API v1
 */

import { logApiCall, createApiTimer } from '@/lib/api-logger';

export const API_URL = process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333";
export const API_VERSION = "v1";
export const API_BASE = `${API_URL}/api/${API_VERSION}`;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export async function fetchAPI<T>(endpoint: string, options?: RequestInit & { cookie?: string }): Promise<T> {
  // Determine if endpoint is already versioned or needs base URL
  const url = endpoint.startsWith("/api/")
    ? `${API_URL}${endpoint}`
    : `${API_BASE}${endpoint}`;

  const method = (options?.method || 'GET') as HttpMethod;
  const body = options?.body ? JSON.parse(options.body as string) : undefined;
  const getElapsedTime = createApiTimer();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Forward cookie if provided, or try to get from server-side cookies
  if (options?.cookie) {
    headers["Cookie"] = options.cookie;
  } else {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll().map((c: { name: string; value: string }) => `${c.name}=${c.value}`).join("; ");
      if (allCookies) {
        headers["Cookie"] = allCookies;
      }
    } catch {
      // Not in a Server Component context, ignore
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important pour envoyer les cookies côté client
  });

  const duration = getElapsedTime();
  const hasAuth = !!(headers as Record<string, string>)["Cookie"];

  if (!res.ok) {
    logApiCall({ method, url, status: res.status, duration, hasAuth, body, error: res.statusText });
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  logApiCall({ method, url, status: res.status, duration, hasAuth, body });

  const data = await res.json();
  return transformDates(data);
}

function transformDates(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    const date = new Date(data);
    if (!isNaN(date.getTime()) && data.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return date;
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => transformDates(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = transformDates(data[key]);
    }
    return result;
  }
  
  return data;
}

