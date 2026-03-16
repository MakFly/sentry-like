"use client";

import React from "react";
import Link from "next/link";
import {
  Settings,
  Bell,
  Key,
  Database,
  CreditCard,
  Building2,
  FlaskConical,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";
import {
  GeneralSection,
  AlertsSection,
  ApiKeysSection,
  BillingSection,
  DataSection,
  OrganizationsSection,
} from "./sections";

export function SettingsContent() {
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProject } = useCurrentProject();

  const integrationTestPath =
    currentOrgSlug && currentProject?.slug
      ? `/dashboard/${currentOrgSlug}/${currentProject.slug}/settings/integration-test`
      : "/dashboard";

  return (
    <div className="px-4 lg:px-6">
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-4 flex justify-end">
          <Button asChild variant="outline">
            <Link href={integrationTestPath}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Integration Test
            </Link>
          </Button>
        </div>
      )}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger
            value="general"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger
            value="api-keys"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
          >
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSection />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsSection />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <ApiKeysSection />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingSection />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataSection />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <OrganizationsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
