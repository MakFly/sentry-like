import type { PlanType } from './billing';

export type Platform = "symfony" | "laravel" | "vuejs" | "react" | "nextjs" | "nuxtjs" | "nodejs" | "hono" | "fastify";

export type Project = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  environment: string;
  platform: Platform;
  createdAt: Date;
};

export type SdkInstructions = {
  platform: Platform;
  name: string;
  icon: string;
  category: string;
  package: string;
  installCommand: string;
  configSnippet: string;
};

export type SubscriptionCheck = {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxProjects: number;
  isBypassed: boolean;
  plan: PlanType;
};

export type ProjectSettings = {
  id: string;
  projectId: string;
  timezone: string;
  retentionDays: number;
  autoResolve: boolean;
  autoResolveDays: number;
  eventsEnabled: boolean;
  updatedAt: Date;
};

