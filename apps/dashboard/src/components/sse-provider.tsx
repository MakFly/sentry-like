"use client";

import { useSSE, type SSEStatus } from "@/hooks/useSSE";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { createContext, useContext } from "react";

const SSEContext = createContext<SSEStatus>("disconnected");

export function useSSEStatus() {
  return useContext(SSEContext);
}

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { currentOrgId } = useCurrentOrganization();
  const status = useSSE(currentOrgId ?? undefined);

  return <SSEContext.Provider value={status}>{children}</SSEContext.Provider>;
}
