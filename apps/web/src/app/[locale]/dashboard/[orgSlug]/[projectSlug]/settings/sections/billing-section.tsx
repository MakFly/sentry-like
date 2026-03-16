"use client";

import React from "react";
import { Crown, Database, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc/client";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function BillingSection() {
  const t = useTranslations("settings.billing");

  const { currentProjectId } = useCurrentProject();
  const { data: billingSummary, isLoading } = trpc.billing.getSummary.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: true }
  );

  const createCheckoutMutation = trpc.billing.createCheckout.useMutation();
  const createPortalMutation = trpc.billing.createPortal.useMutation();

  const handleUpgrade = async () => {
    try {
      const result = await createCheckoutMutation.mutateAsync({ plan: "pro" });
      if (result?.url) window.location.href = result.url;
      else toast.error(t("stripeNotConfigured"));
    } catch {
      toast.error(t("stripeNotConfigured"));
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await createPortalMutation.mutateAsync();
      if (result?.url) window.location.href = result.url;
      else toast.error(t("stripeNotConfigured"));
    } catch {
      toast.error(t("stripeNotConfigured"));
    }
  };

  const plan = billingSummary?.plan || "free";
  const usage = billingSummary?.usage;
  const quotas = billingSummary?.quotas;
  const selfHosted = billingSummary?.selfHosted ?? false;
  const isPaidPlan = plan !== "free";
  const hasBillingCustomer = !!billingSummary?.billing?.stripeCustomerId;
  const billingEnabled = billingSummary?.billingEnabled ?? false;
  const usagePercent = usage ? Math.min(100, usage.percentage) : 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t("currentPlanTitle")}
          </CardTitle>
          <CardDescription>{t("currentPlanDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold capitalize">{plan}</p>
              <p className="text-sm text-muted-foreground">
                {t("retentionDays", { days: quotas?.retentionDays || 0 })}
              </p>
            </div>
            <Badge variant={isPaidPlan ? "default" : "secondary"}>
              {selfHosted ? t("selfHosted") : isPaidPlan ? t("active") : t("free")}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {quotas?.projects === -1 ? t("unlimited") : quotas?.projects}{" "}
              {t("projectsQuota", { count: quotas?.projects === -1 ? 0 : (quotas?.projects ?? 0) }).replace(/^\d+\s/, "")}
            </p>
            <p>
              {quotas?.users === -1 ? t("unlimited") : quotas?.users}{" "}
              {t("usersQuota", { count: quotas?.users === -1 ? 0 : (quotas?.users ?? 0) }).replace(/^\d+\s/, "")}
            </p>
          </div>

          {selfHosted ? (
            <p className="text-xs text-muted-foreground">
              {t("selfHostedNote")}
            </p>
          ) : isPaidPlan && hasBillingCustomer ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleManageBilling}
              disabled={createPortalMutation.isPending || !billingEnabled}
            >
              {createPortalMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t("manageBilling")}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleUpgrade}
              disabled={createCheckoutMutation.isPending || !billingEnabled}
            >
              {createCheckoutMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t("upgradeToPro")}
            </Button>
          )}

          {!billingEnabled && !selfHosted && (
            <p className="text-xs text-muted-foreground">
              {t("stripeNotConfigured")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t("monthlyUsageTitle")}
          </CardTitle>
          <CardDescription>{t("monthlyUsageDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("eventsLabel")}</span>
              <span className="font-medium">
                {(usage?.used || 0).toLocaleString()} / {usage?.limit === -1 ? "∞" : (usage?.limit || 0).toLocaleString()}
              </span>
            </div>
            <Progress value={usage?.limit === -1 ? 0 : usagePercent} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground">
            {usage?.limit === -1
              ? t("unlimitedEvents")
              : t("eventsRemaining", { count: Math.max(0, (usage?.limit || 0) - (usage?.used || 0)).toLocaleString() })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
