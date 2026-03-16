"use client";

import React, { useState, useEffect } from "react";
import { Database, Check, RefreshCw, Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function DataSection() {
  const t = useTranslations("settings.data");

  const [retentionDays, setRetentionDays] = useState("30");
  const [autoResolve, setAutoResolve] = useState(true);
  const [autoResolveDays, setAutoResolveDays] = useState("14");
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const { currentProjectId } = useCurrentProject();
  const { data: projectSettings, refetch: refetchSettings } = trpc.projectSettings.get.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const updateSettingsMutation = trpc.projectSettings.update.useMutation({ onSuccess: () => refetchSettings() });

  useEffect(() => {
    if (projectSettings) {
      setRetentionDays(String(projectSettings.retentionDays));
      setAutoResolve(projectSettings.autoResolve);
      setAutoResolveDays(String(projectSettings.autoResolveDays));
      setEventsEnabled(projectSettings.eventsEnabled ?? true);
    }
  }, [projectSettings]);

  const saveSettings = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        projectId: currentProjectId,
        retentionDays: parseInt(retentionDays),
        autoResolve,
        autoResolveDays: parseInt(autoResolveDays),
        eventsEnabled,
      });
      toast.success(t("toastSaved"));
    } catch {
      toast.error(t("toastFailed"));
    } finally {
      setSaving(false);
    }
  };

  const retentionOptions = [
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
    { value: "60", label: "60 days" },
    { value: "90", label: "90 days" },
  ];

  const resolveOptions = [
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cn("bg-gradient-to-t to-card", eventsEnabled ? "from-green-500/10" : "from-red-500/10 border-red-500/30")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className={cn("h-5 w-5", eventsEnabled ? "text-green-500" : "text-red-500")} />
                  {t("eventIngestionTitle")}
                </CardTitle>
                <CardDescription>
                  {eventsEnabled ? t("eventIngestionEnabled") : t("eventIngestionDisabled")}
                </CardDescription>
              </div>
              <Switch checked={eventsEnabled} onCheckedChange={setEventsEnabled} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {eventsEnabled
                ? t("eventIngestionEnabledNote")
                : t("eventIngestionDisabledNote")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {t("retentionTitle")}
            </CardTitle>
            <CardDescription>{t("retentionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("retentionPeriodLabel")}</Label>
              <Select value={retentionDays} onValueChange={setRetentionDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {retentionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("retentionNote", { days: retentionDays })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  {t("autoResolveTitle")}
                </CardTitle>
                <CardDescription>{t("autoResolveDescription")}</CardDescription>
              </div>
              <Switch checked={autoResolve} onCheckedChange={setAutoResolve} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !autoResolve && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label>{t("inactivityPeriodLabel")}</Label>
              <Select value={autoResolveDays} onValueChange={setAutoResolveDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolveOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("autoResolveNote", { days: autoResolveDays })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </div>
    </>
  );
}
