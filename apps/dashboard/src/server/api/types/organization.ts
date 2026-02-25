import type { User } from './user';
import type { PlanType } from './billing';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
};

export type OrganizationSubscriptionCheck = {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxOrganizations: number;
  isBypassed: boolean;
  plan: PlanType;
};

export type Member = {
  id: string;
  userId: string;
  user?: User;
  role: "owner" | "admin" | "member";
  createdAt: Date;
};

export type Invite = {
  inviteUrl?: string;
  inviteToken?: string;
  message?: string;
  success?: boolean;
  userCreated?: boolean;
  tempPassword?: string;
};

