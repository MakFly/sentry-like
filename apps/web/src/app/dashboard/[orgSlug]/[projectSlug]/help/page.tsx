"use client";

import { HelpCircle, BookOpen, Zap, MessageSquare, FileText, Settings, LayoutDashboard, Bug, BarChart3, Film } from "lucide-react";
import Link from "next/link";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";

export default function HelpPage() {
  const { currentOrgSlug } = useCurrentOrganization();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Help Center</h1>
            <p className="text-muted-foreground">Learn how to use ErrorWatch effectively</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-600" />
            Quick Start
          </h2>
          <p className="mb-4 text-muted-foreground">
            Get started with ErrorWatch in minutes
          </p>
          <div className="space-y-3">
            <Link href={`/dashboard/${currentOrgSlug}`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600/10">
                <LayoutDashboard className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium">Dashboard Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Understand the main dashboard and its metrics
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/issues`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/10">
                <Bug className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Managing Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to track and resolve errors
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/replays`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600/10">
                <Film className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Session Replays</h3>
                <p className="text-sm text-muted-foreground">
                  Replay user sessions to understand errors
                </p>
              </div>
            </Link>
            <Link href={`/dashboard/${currentOrgSlug}/stats`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600/10">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium">Statistics & Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze error trends and patterns
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Documentation
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/docs/getting-started" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Getting Started</h3>
                <p className="text-sm text-muted-foreground">
                  Installation and setup guide
                </p>
              </div>
            </Link>
            <Link href="/docs/sdk-integration" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">SDK Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Integrate with your framework
                </p>
              </div>
            </Link>
            <Link href="/docs/api" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">API Reference</h3>
                <p className="text-sm text-muted-foreground">
                  Complete API documentation
                </p>
              </div>
            </Link>
            <Link href="/docs/configuration" className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure monitoring and alerts
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Common Tasks
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Managing Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Create, configure, and delete projects. Use the project selector in the sidebar to switch between projects.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Managing Team Members</h3>
                <p className="text-sm text-muted-foreground">
                  Invite team members to your organization. Go to Settings &gt; Team to manage access.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600/10">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Setting Up Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Configure alerts to be notified about errors. Go to Settings &gt; Alerts to set up notification preferences.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            Need More Help?
          </h2>
          <p className="mb-4 text-muted-foreground">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="flex gap-3">
            <Link href="https://github.com/your-org/errorwatch/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
              <MessageSquare className="h-4 w-4" />
              Open an Issue
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
              <BookOpen className="h-4 w-4" />
              Full Documentation
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
