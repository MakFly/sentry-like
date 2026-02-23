"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { useGroup, useGroupEvents, useGroupTimeline } from "@/lib/trpc/hooks";
import { trpc } from "@/lib/trpc/client";
import { AlertTriangle, ArrowLeft } from "lucide-react";

// Issue detail components
import {
  IssueHeader,
  OccurrenceChart,
  EventTimeline,
  StackTraceViewer,
  ContextCards,
} from "@/components/issue-detail";

function ErrorState() {
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();

  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6 lg:p-8">
      <Link
        href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-mono">issues</span>
      </Link>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-signal-error/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-signal-error/30 bg-signal-error/10">
            <AlertTriangle className="h-10 w-10 text-signal-error" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="mt-8 font-mono text-xl font-medium text-signal-error">
          Signal not found
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This error doesn&apos;t exist or has been deleted.
        </p>
        <Link
          href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
          className="mt-6 font-mono text-sm text-pulse-primary hover:text-pulse-primary/80 transition-colors"
        >
          Return to issues
        </Link>
      </div>
    </div>
  );
}

export default function IssueDetailPage() {
  const params = useParams();
  const fingerprint = params.fingerprint as string;
  const { currentOrgSlug, currentOrgId } = useCurrentOrganization();
  const { currentProjectSlug } = useCurrentProject();

  // Fetch data
  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
    refetch: refetchGroup,
  } = useGroup(fingerprint);

  const { data: eventsData } = useGroupEvents(fingerprint, 1, 10);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { data: timeline } = useGroupTimeline(fingerprint);

  // Fetch releases
  const { data: releasesData } = trpc.groups.getReleases.useQuery(
    { fingerprint },
    { enabled: !!fingerprint }
  );

  // Fetch members for assignment
  const { data: members } = trpc.members.getByOrganization.useQuery(
    { organizationId: currentOrgId || "" },
    { enabled: !!currentOrgId }
  );

  // Mutations
  const updateStatusMutation = trpc.groups.updateStatus.useMutation({
    onSuccess: () => refetchGroup(),
  });

  const updateAssignmentMutation = trpc.groups.updateAssignment.useMutation({
    onSuccess: () => refetchGroup(),
  });

  // Derive data
  const events = eventsData?.events || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    if (selectedEventId) {
      return events.find((e) => e.id === selectedEventId) || events[0];
    }
    return events[0];
  }, [events, selectedEventId]);

  const membersList = useMemo(() => {
    return (members || []).map((m) => ({
      id: m.userId,
      name: m.user?.name || null,
      email: m.user?.email,
      image: m.user?.image || null,
    }));
  }, [members]);

  // Loading state
  if (groupLoading) {
    return null;
  }

  // Error state
  if (groupError || !group) {
    return <ErrorState />;
  }

  // Prepare timeline data
  const timelineData =
    timeline && timeline.length > 0
      ? timeline.map((t) => ({ date: t.date, count: t.count }))
      : [{ date: new Date(group.firstSeen).toISOString().split("T")[0], count: group.count }];

  return (
    <div className="min-h-screen bg-issues-bg p-4 md:p-6 lg:p-8 space-y-6">
      <Link
        href={`/dashboard/${currentOrgSlug}/${currentProjectSlug}/issues`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-mono">← Retour</span>
      </Link>

      {/* Header */}
      <IssueHeader
        message={group.message}
        file={group.file}
        line={group.line}
        level={group.level}
        status={group.status || "open"}
        statusCode={group.statusCode}
        orgSlug={currentOrgSlug || ""}
        onStatusChange={(status) =>
          updateStatusMutation.mutate({ fingerprint, status: status as "open" | "resolved" | "ignored" })
        }
        isUpdating={updateStatusMutation.isPending}
        assignedTo={group.assignedTo}
        members={membersList}
        onAssign={(userId) =>
          updateAssignmentMutation.mutate({ fingerprint, assignedTo: userId })
        }
        isAssigning={updateAssignmentMutation.isPending}
        resolvedBy={group.resolvedBy}
        resolvedAt={group.resolvedAt}
      />

      {/* Occurrence Chart */}
      <OccurrenceChart
        count={group.count}
        firstSeen={group.firstSeen}
        lastSeen={group.lastSeen}
        timeline={timelineData}
      />

      {/* Event Timeline */}
      {selectedEvent && (
        <EventTimeline
          breadcrumbs={selectedEvent.breadcrumbs}
          errorTimestamp={selectedEvent.createdAt}
          errorMessage={group.message}
          sessionId={selectedEvent.sessionId}
          errorEventId={selectedEvent.id}
          orgSlug={currentOrgSlug || ""}
          projectSlug={currentProjectSlug || ""}
        />
      )}

      {/* Stack Trace */}
      <StackTraceViewer
        stack={selectedEvent?.stack || "No stack trace available"}
        highlightFile={group.file}
        highlightLine={group.line}
      />

      {/* Context Cards */}
      <ContextCards
        env={selectedEvent?.env}
        releases={releasesData?.releases}
        firstSeenIn={releasesData?.firstSeenIn}
      />
    </div>
  );
}
