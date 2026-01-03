import { fetchAPI } from './client';
import type { Session } from './types';

export const getSession = async (): Promise<Session | null> => {
  try {
    return await fetchAPI<Session | null>("/api/auth/get-session");
  } catch {
    return null;
  }
};

