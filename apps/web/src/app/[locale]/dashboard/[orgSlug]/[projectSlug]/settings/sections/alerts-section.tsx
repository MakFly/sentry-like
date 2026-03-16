"use client";

import React, { useState, useEffect } from "react";
import { Mail, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function AlertsSection() {
  const t = useTranslations("settings.alerts");

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [threshold, setThreshold] = useState("10");
  const [saving, setSaving] = useState(false);

  const { currentProjectId } = useCurrentProject();
  const { data: alertRules, refetch: refetchAlerts } = trpc.alerts.getRules.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const createAlertMutation = trpc.alerts.createRule.useMutation();
  const updateAlertMutation = trpc.alerts.updateRule.useMutation();

  useEffect(() => {
    if (alertRules) {
      const emailRule = alertRules.find((r) => r.channel === "email" && r.type === "new_error");
      const slackRule = alertRules.find((r) => r.channel === "slack");
      const thresholdRule = alertRules.find((r) => r.type === "threshold");

      if (emailRule) {
        setEmailEnabled(emailRule.enabled);
        setEmailAddress(emailRule.config?.email || "");
      }
      if (slackRule) {
        setSlackEnabled(slackRule.enabled);
        setSlackWebhook(slackRule.config?.slackWebhook || "");
      }
      if (thresholdRule) {
        setThreshold(String(thresholdRule.threshold || 10));
      }
    }
  }, [alertRules]);

  const saveSettings = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    try {
      const existingEmailRule = alertRules?.find((r) => r.channel === "email" && r.type === "new_error");
      const existingSlackRule = alertRules?.find((r) => r.channel === "slack");

      if (emailEnabled && emailAddress) {
        if (existingEmailRule) {
          await updateAlertMutation.mutateAsync({
            id: existingEmailRule.id,
            updates: { enabled: true, config: { email: emailAddress } },
          });
        } else {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "Email Alerts",
            type: "new_error",
            channel: "email",
            config: { email: emailAddress },
          });
        }
      } else if (existingEmailRule) {
        await updateAlertMutation.mutateAsync({ id: existingEmailRule.id, updates: { enabled: false } });
      }

      if (slackEnabled && slackWebhook) {
        if (existingSlackRule) {
          await updateAlertMutation.mutateAsync({
            id: existingSlackRule.id,
            updates: { enabled: true, config: { slackWebhook } },
          });
        } else {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "Slack Alerts",
            type: "new_error",
            channel: "slack",
            config: { slackWebhook },
          });
        }
      } else if (existingSlackRule) {
        await updateAlertMutation.mutateAsync({ id: existingSlackRule.id, updates: { enabled: false } });
      }

      await refetchAlerts();
      toast.success(t("toastSaved"));
    } catch {
      toast.error(t("toastFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {t("emailCardTitle")}
                </CardTitle>
                <CardDescription>{t("emailCardDescription")}</CardDescription>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !emailEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailAddressLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">{t("emailDigestNote")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t("slackCardTitle")}
                </CardTitle>
                <CardDescription>{t("slackCardDescription")}</CardDescription>
              </div>
              <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !slackEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="slack">{t("slackWebhookLabel")}</Label>
              <Input
                id="slack"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder={t("slackWebhookPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
            <Button variant="outline" className="w-full" disabled={!slackWebhook}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("slackTestConnection")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            {t("thresholdCardTitle")}
          </CardTitle>
          <CardDescription>{t("thresholdCardDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-24"
            />
            <span className="text-muted-foreground">{t("thresholdEventsPerHour")}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </div>
    </>
  );
}
