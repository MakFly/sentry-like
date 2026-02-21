"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type SSEStatus = "connected" | "connecting" | "disconnected";
export type LiveLogEvent = {
  type: "log:new";
  projectId: string;
  payload: {
    log: {
      id: string;
      timestamp: string;
      level: "debug" | "info" | "warning" | "error";
      channel: string;
      message: string;
      source: "http" | "cli" | "messenger" | "deprecation" | "app";
      env?: string | null;
      release?: string | null;
    };
    sampled?: boolean;
  };
  timestamp: number;
};

export function useSSE(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SSEStatus>("disconnected");

  useEffect(() => {
    if (!orgId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
    const es = new EventSource(`${apiUrl}/sse/${orgId}`, {
      withCredentials: true,
    });

    es.onopen = () => setStatus("connected");
    es.onerror = () => setStatus("connecting"); // EventSource auto-reconnects

    es.addEventListener("update", (e) => {
      try {
        const event = JSON.parse(e.data);
        switch (event.type) {
          case "issue:new":
          case "issue:updated":
            queryClient.invalidateQueries({ queryKey: [["groups"]] });
            queryClient.invalidateQueries({ queryKey: [["stats"]] });
            break;
          case "alert:triggered":
            queryClient.invalidateQueries({ queryKey: [["alerts"]] });
            if (!(window as Window & { __errorwatchLogsFocused?: boolean }).__errorwatchLogsFocused) {
              toast.info(`Alert: ${event.payload.message}`, {
                description: "A new alert was triggered",
              });
            }
            break;
          case "transaction:new":
            queryClient.invalidateQueries({ queryKey: [["performance"]] });
            break;
          case "replay:new":
            queryClient.invalidateQueries({ queryKey: [["replay"]] });
            break;
          case "log:new":
            window.dispatchEvent(new CustomEvent<LiveLogEvent>("errorwatch:log:new", { detail: event }));
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    return () => {
      es.close();
      setStatus("disconnected");
    };
  }, [orgId, queryClient]);

  return status;
}
