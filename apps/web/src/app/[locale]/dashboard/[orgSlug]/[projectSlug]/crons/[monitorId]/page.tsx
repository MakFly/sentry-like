"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import cronstrue from "cronstrue";
import { ArrowLeft, Edit, Trash2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CronCheckinStatus,
  CronMonitorStatus,
  CronTimeline,
} from "@/server/api/types";

function formatSchedule(schedule: string | null): string {
  if (!schedule) return "-";
  try {
    return cronstrue.toString(schedule, { throwExceptionOnParseError: true });
  } catch {
    return schedule;
  }
}

function MonitorStatusBadge({ status }: { status: CronMonitorStatus }) {
  const colors: Record<CronMonitorStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    paused: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    disabled: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={colors[status]}>
      {status}
    </Badge>
  );
}

function CheckinStatusBadge({ status }: { status: CronCheckinStatus | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const colors: Record<CronCheckinStatus, string> = {
    ok: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    error: "bg-red-500/15 text-red-600 border-red-500/30",
    missed: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    in_progress: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  };
  const labels: Record<CronCheckinStatus, string> = {
    ok: "OK",
    error: "Error",
    missed: "Missed",
    in_progress: "In Progress",
  };
  return (
    <Badge variant="outline" className={colors[status]}>
      {labels[status]}
    </Badge>
  );
}

function TimelineBar({ data }: { data: CronTimeline[] }) {
  const last14 = data.slice(-14);

  const getDominantStatus = (
    day: CronTimeline
  ): "ok" | "error" | "missed" | "in_progress" | "empty" => {
    const total = day.ok + day.error + day.missed + day.in_progress;
    if (total === 0) return "empty";
    if (day.error > 0) return "error";
    if (day.missed > 0) return "missed";
    if (day.in_progress > 0) return "in_progress";
    return "ok";
  };

  const colors: Record<string, string> = {
    ok: "bg-emerald-500",
    error: "bg-red-500",
    missed: "bg-amber-500",
    in_progress: "bg-blue-500",
    empty: "bg-muted",
  };

  return (
    <div className="flex gap-1">
      {last14.map((day) => {
        const status = getDominantStatus(day);
        return (
          <div
            key={day.date}
            title={`${new Date(day.date).toLocaleDateString()} — ok: ${day.ok}, error: ${day.error}, missed: ${day.missed}`}
            className={`h-8 flex-1 rounded-sm ${colors[status]} transition-opacity hover:opacity-80`}
          />
        );
      })}
    </div>
  );
}

export default function CronDetailPage() {
  const t = useTranslations("crons");
  const params = useParams();
  const router = useRouter();
  const monitorId = params.monitorId as string;
  const orgSlug = params.orgSlug as string;
  const projectSlug = params.projectSlug as string;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editForm, setEditForm] = useState<{
    name: string;
    schedule: string;
    timezone: string;
    toleranceMinutes: number;
    status: CronMonitorStatus;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: monitor, isLoading: monitorLoading } = trpc.cron.getMonitor.useQuery(
    { id: monitorId },
    { enabled: !!monitorId }
  );

  const { data: checkinsData, isLoading: checkinsLoading } = trpc.cron.getCheckins.useQuery(
    { monitorId, page, limit: 20 },
    { enabled: !!monitorId }
  );

  const { data: timeline } = trpc.cron.getTimeline.useQuery(
    { monitorId },
    { enabled: !!monitorId }
  );

  const updateMutation = trpc.cron.updateMonitor.useMutation({
    onSuccess: () => {
      toast.success(t("monitorUpdated"));
      setEditOpen(false);
      utils.cron.getMonitor.invalidate({ id: monitorId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.cron.deleteMonitor.useMutation({
    onSuccess: () => {
      toast.success(t("monitorDeleted"));
      router.push(`/dashboard/${orgSlug}/${projectSlug}/crons`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleEditOpen = () => {
    if (!monitor) return;
    setEditForm({
      name: monitor.name,
      schedule: monitor.schedule ?? "",
      timezone: monitor.timezone,
      toleranceMinutes: monitor.toleranceMinutes,
      status: monitor.status,
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editForm) return;
    updateMutation.mutate({
      id: monitorId,
      updates: {
        name: editForm.name,
        schedule: editForm.schedule || undefined,
        timezone: editForm.timezone,
        toleranceMinutes: editForm.toleranceMinutes,
        status: editForm.status,
      },
    });
  };

  const baseUrl = `/dashboard/${orgSlug}/${projectSlug}`;
  const checkins = checkinsData?.items ?? [];
  const hasMore = checkinsData?.hasMore ?? false;

  if (monitorLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Monitor not found.</p>
        <Link href={`${baseUrl}/crons`}>
          <Button variant="outline" size="sm">
            {t("back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`${baseUrl}/crons`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" />
              {t("back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{monitor.name}</h1>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{monitor.slug}</code>
              <MonitorStatusBadge status={monitor.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleEditOpen}>
            <Edit className="size-4" />
            {t("edit")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("delete")}
          </Button>
        </div>
      </div>

      {/* Monitor Info */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("schedule")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {monitor.schedule ? (
                <span title={monitor.schedule}>{formatSchedule(monitor.schedule)}</span>
              ) : (
                <span className="italic text-muted-foreground">{t("noSchedule")}</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("timezone")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{monitor.timezone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("lastCheckin")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {monitor.lastCheckinAt
                  ? new Date(monitor.lastCheckinAt).toLocaleString()
                  : "-"}
              </p>
              <CheckinStatusBadge status={monitor.lastCheckinStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("nextExpected")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {monitor.nextExpectedAt
                ? new Date(monitor.nextExpectedAt).toLocaleString()
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              {t("timeline")}
            </CardTitle>
            <CardDescription>Last 14 days status</CardDescription>
          </CardHeader>
          <CardContent>
            <TimelineBar data={timeline} />
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                {t("checkinOk")}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
                {t("checkinError")}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
                {t("checkinMissed")}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                {t("checkinInProgress")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-ins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("checkins")}</CardTitle>
        </CardHeader>
        <CardContent>
          {checkinsLoading ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : checkins.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground">No check-ins yet.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("duration")}</TableHead>
                    <TableHead>{t("environment")}</TableHead>
                    <TableHead>{t("startedAt")}</TableHead>
                    <TableHead>{t("finishedAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkins.map((checkin) => (
                    <TableRow key={checkin.id}>
                      <TableCell>
                        <CheckinStatusBadge status={checkin.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {checkin.duration != null
                          ? `${checkin.duration}ms`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {checkin.env ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {checkin.startedAt
                          ? new Date(checkin.startedAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {checkin.finishedAt
                          ? new Date(checkin.finishedAt).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
            <DialogDescription>{monitor.name}</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("name")}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => p ? { ...p, name: e.target.value } : p)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-schedule">{t("schedule")}</Label>
                <Input
                  id="edit-schedule"
                  value={editForm.schedule}
                  onChange={(e) =>
                    setEditForm((p) => p ? { ...p, schedule: e.target.value } : p)
                  }
                  placeholder="0 * * * *"
                />
                {editForm.schedule && (
                  <p className="text-xs text-muted-foreground">
                    {formatSchedule(editForm.schedule)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-timezone">{t("timezone")}</Label>
                  <Input
                    id="edit-timezone"
                    value={editForm.timezone}
                    onChange={(e) =>
                      setEditForm((p) => p ? { ...p, timezone: e.target.value } : p)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tolerance">{t("tolerance")}</Label>
                  <Input
                    id="edit-tolerance"
                    type="number"
                    min={1}
                    value={editForm.toleranceMinutes}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, toleranceMinutes: Number(e.target.value) } : p
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">{t("status")}</Label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, status: e.target.value as CronMonitorStatus } : p
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="active">{t("statusActive")}</option>
                  <option value="paused">{t("statusPaused")}</option>
                  <option value="disabled">{t("statusDisabled")}</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: monitorId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
