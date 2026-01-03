"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, AlertTriangle, Play } from "lucide-react";
import ReplayPlayer from "@/components/ReplayPlayer";

export default function ReplayPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();
  const sessionId = params.sessionId as string;
  const errorTime = searchParams.get("errorTime");
  const errorEventId = searchParams.get("errorEventId"); // Sentry-like: get events for specific error

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = trpc.replay.getSession.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      retry: 1, // Retry once then give up
    }
  );

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = trpc.replay.getSessionEvents.useQuery(
    {
      sessionId,
      errorEventId: errorEventId || undefined,
      errorTime: errorTime || undefined,
    },
    {
      enabled: !!sessionId && !!session, // Only fetch events if session exists
      retry: 1,
    }
  );

  const events = eventsData?.events || [];
  const metadata = eventsData?.metadata;

  const isLoading = sessionLoading || (session && eventsLoading);
  const hasError = sessionError || eventsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Player skeleton */}
          <div className="aspect-video bg-zinc-900 rounded-xl animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <Play className="h-6 w-6 text-zinc-600" />
            </div>
          </div>

          {/* Meta skeleton */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-zinc-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Session not found
          </h3>
          <p className="text-zinc-400 mb-6">
            This replay session may have been deleted or does not exist.
          </p>
          <Link
            href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/replays`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to replays
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Navigation */}
        <Link
          href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/replays`}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to replays</span>
        </Link>

        {/* Player with integrated metadata */}
        {events.length > 0 ? (
          <ReplayPlayer
            events={events}
            metadata={metadata}
            errorTimestamp={errorTime ? new Date(errorTime) : undefined}
          />
        ) : (
          <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No events recorded
              </h3>
              <p className="text-zinc-400 max-w-md">
                This session has no recorded events. The user may have left the
                page before any interactions were captured.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
