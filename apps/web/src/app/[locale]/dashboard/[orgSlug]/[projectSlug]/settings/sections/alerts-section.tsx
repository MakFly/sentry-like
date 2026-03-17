"use client";

import React, { useState, useEffect } from "react";
import { Mail, MessageSquare, AlertTriangle, RefreshCw, MessageCircle, Send, Github, GitBranch } from "lucide-react";
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
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [gitlabEnabled, setGitlabEnabled] = useState(false);
  const [gitlabToken, setGitlabToken] = useState("");
  const [gitlabProjectId, setGitlabProjectId] = useState("");
  const [gitlabUrl, setGitlabUrl] = useState("https://gitlab.com");
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
      const discordRule = alertRules.find((r) => r.channel === "discord");
      const telegramRule = alertRules.find((r) => r.channel === "telegram");
      const githubRule = alertRules.find((r) => r.channel === "github");
      const gitlabRule = alertRules.find((r) => r.channel === "gitlab");
      const thresholdRule = alertRules.find((r) => r.type === "threshold");

      if (emailRule) {
        setEmailEnabled(emailRule.enabled);
        setEmailAddress(emailRule.config?.email || "");
      }
      if (slackRule) {
        setSlackEnabled(slackRule.enabled);
        setSlackWebhook(slackRule.config?.slackWebhook || "");
      }
      if (discordRule) {
        setDiscordEnabled(discordRule.enabled);
        setDiscordWebhook(discordRule.config?.discordWebhook || "");
      }
      if (telegramRule) {
        setTelegramEnabled(telegramRule.enabled);
        setTelegramBotToken(telegramRule.config?.telegramBotToken || "");
        setTelegramChatId(telegramRule.config?.telegramChatId || "");
      }
      if (githubRule) {
        setGithubEnabled(githubRule.enabled);
        setGithubToken(""); // Never display stored token
        setGithubRepo(githubRule.config?.githubRepo || "");
      }
      if (gitlabRule) {
        setGitlabEnabled(gitlabRule.enabled);
        setGitlabToken(""); // Never display stored token
        setGitlabProjectId(gitlabRule.config?.gitlabProjectId || "");
        setGitlabUrl(gitlabRule.config?.gitlabUrl || "https://gitlab.com");
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
      const existingDiscordRule = alertRules?.find((r) => r.channel === "discord");
      const existingTelegramRule = alertRules?.find((r) => r.channel === "telegram");
      const existingGithubRule = alertRules?.find((r) => r.channel === "github");
      const existingGitlabRule = alertRules?.find((r) => r.channel === "gitlab");

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

      if (discordEnabled && discordWebhook) {
        if (existingDiscordRule) {
          await updateAlertMutation.mutateAsync({
            id: existingDiscordRule.id,
            updates: { enabled: true, config: { discordWebhook } },
          });
        } else {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "Discord Alerts",
            type: "new_error",
            channel: "discord",
            config: { discordWebhook },
          });
        }
      } else if (existingDiscordRule) {
        await updateAlertMutation.mutateAsync({ id: existingDiscordRule.id, updates: { enabled: false } });
      }

      if (telegramEnabled && telegramBotToken && telegramChatId) {
        if (existingTelegramRule) {
          await updateAlertMutation.mutateAsync({
            id: existingTelegramRule.id,
            updates: { enabled: true, config: { telegramBotToken, telegramChatId } },
          });
        } else {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "Telegram Alerts",
            type: "new_error",
            channel: "telegram",
            config: { telegramBotToken, telegramChatId },
          });
        }
      } else if (existingTelegramRule) {
        await updateAlertMutation.mutateAsync({ id: existingTelegramRule.id, updates: { enabled: false } });
      }

      if (githubEnabled && githubRepo) {
        const githubConfig = githubToken
          ? { githubToken, githubRepo }
          : { githubRepo };
        if (existingGithubRule) {
          await updateAlertMutation.mutateAsync({
            id: existingGithubRule.id,
            updates: { enabled: true, config: githubConfig },
          });
        } else if (githubToken) {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "GitHub Issues",
            type: "new_error",
            channel: "github",
            config: { githubToken, githubRepo },
          });
        }
      } else if (existingGithubRule) {
        await updateAlertMutation.mutateAsync({ id: existingGithubRule.id, updates: { enabled: false } });
      }

      if (gitlabEnabled && gitlabProjectId) {
        const gitlabConfig = gitlabToken
          ? { gitlabToken, gitlabProjectId, gitlabUrl }
          : { gitlabProjectId, gitlabUrl };
        if (existingGitlabRule) {
          await updateAlertMutation.mutateAsync({
            id: existingGitlabRule.id,
            updates: { enabled: true, config: gitlabConfig },
          });
        } else if (gitlabToken) {
          await createAlertMutation.mutateAsync({
            projectId: currentProjectId,
            name: "GitLab Issues",
            type: "new_error",
            channel: "gitlab",
            config: { gitlabToken, gitlabProjectId, gitlabUrl },
          });
        }
      } else if (existingGitlabRule) {
        await updateAlertMutation.mutateAsync({ id: existingGitlabRule.id, updates: { enabled: false } });
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

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  {t("discordCardTitle")}
                </CardTitle>
                <CardDescription>{t("discordCardDescription")}</CardDescription>
              </div>
              <Switch checked={discordEnabled} onCheckedChange={setDiscordEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !discordEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="discord-webhook">{t("discordWebhookLabel")}</Label>
              <Input
                id="discord-webhook"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                placeholder={t("discordWebhookPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {t("telegramCardTitle")}
                </CardTitle>
                <CardDescription>{t("telegramCardDescription")}</CardDescription>
              </div>
              <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !telegramEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token">{t("telegramBotTokenLabel")}</Label>
              <Input
                id="telegram-bot-token"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder={t("telegramBotTokenPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id">{t("telegramChatIdLabel")}</Label>
              <Input
                id="telegram-chat-id"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder={t("telegramChatIdPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-primary" />
                  {t("githubCardTitle")}
                </CardTitle>
                <CardDescription>{t("githubCardDescription")}</CardDescription>
              </div>
              <Switch checked={githubEnabled} onCheckedChange={setGithubEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !githubEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="github-token">{t("githubTokenLabel")}</Label>
              <Input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder={
                  alertRules?.find((r) => r.channel === "github")
                    ? "••••••••"
                    : t("githubTokenPlaceholder")
                }
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-repo">{t("githubRepoLabel")}</Label>
              <Input
                id="github-repo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder={t("githubRepoPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  {t("gitlabCardTitle")}
                </CardTitle>
                <CardDescription>{t("gitlabCardDescription")}</CardDescription>
              </div>
              <Switch checked={gitlabEnabled} onCheckedChange={setGitlabEnabled} />
            </div>
          </CardHeader>
          <CardContent className={cn("space-y-4", !gitlabEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <Label htmlFor="gitlab-token">{t("gitlabTokenLabel")}</Label>
              <Input
                id="gitlab-token"
                type="password"
                value={gitlabToken}
                onChange={(e) => setGitlabToken(e.target.value)}
                placeholder={
                  alertRules?.find((r) => r.channel === "gitlab")
                    ? "••••••••"
                    : t("gitlabTokenPlaceholder")
                }
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gitlab-project-id">{t("gitlabProjectIdLabel")}</Label>
              <Input
                id="gitlab-project-id"
                value={gitlabProjectId}
                onChange={(e) => setGitlabProjectId(e.target.value)}
                placeholder={t("gitlabProjectIdPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gitlab-url">{t("gitlabUrlLabel")}</Label>
              <Input
                id="gitlab-url"
                value={gitlabUrl}
                onChange={(e) => setGitlabUrl(e.target.value)}
                placeholder={t("gitlabUrlPlaceholder")}
                className="font-mono text-sm"
              />
            </div>
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
