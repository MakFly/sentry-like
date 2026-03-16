"use client";

import { useTranslations } from "next-intl";
import { HelpCircle, BookOpen, Zap, MessageSquare, FileText, Settings, LayoutDashboard, Bug, BarChart3, Film } from "lucide-react";
import Link from "next/link";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";

export default function HelpPage() {
  const t = useTranslations("help");
  const { currentOrgSlug } = useCurrentOrganization();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-600" />
            {t("quickStart.title")}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t("quickStart.subtitle")}
          </p>
          <div className="space-y-3">
            <Link href={`/dashboard/${currentOrgSlug}`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600/10">
                <LayoutDashboard className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("quickStart.dashboardOverview.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("quickStart.dashboardOverview.description")}
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/issues`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/10">
                <Bug className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("quickStart.managingIssues.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("quickStart.managingIssues.description")}
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/replays`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600/10">
                <Film className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("quickStart.sessionReplays.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("quickStart.sessionReplays.description")}
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/stats`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600/10">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("quickStart.statistics.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("quickStart.statistics.description")}
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {t("documentation.title")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/docs/getting-started" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">{t("documentation.gettingStarted.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("documentation.gettingStarted.description")}
                </p>
              </div>
            </Link>
            <Link href="/docs/sdk-integration" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">{t("documentation.sdkIntegration.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("documentation.sdkIntegration.description")}
                </p>
              </div>
            </Link>
            <Link href="/docs/api" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">{t("documentation.apiReference.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("documentation.apiReference.description")}
                </p>
              </div>
            </Link>
            <Link href="/docs/configuration" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">{t("documentation.configuration.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("documentation.configuration.description")}
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            {t("commonTasks.title")}
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("commonTasks.managingProjects.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("commonTasks.managingProjects.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("commonTasks.managingTeam.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("commonTasks.managingTeam.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">{t("commonTasks.settingUpAlerts.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("commonTasks.settingUpAlerts.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            {t("moreHelp.title")}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t("moreHelp.subtitle")}
          </p>
          <div className="flex gap-3">
            <Link href="https://github.com/your-org/errorwatch/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
              <MessageSquare className="h-4 w-4" />
              {t("moreHelp.openIssue")}
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
              <BookOpen className="h-4 w-4" />
              {t("moreHelp.fullDocumentation")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
