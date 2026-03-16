import { UserRepository } from "../repositories/UserRepository";
import {
  createBillingPortalSession,
  createCheckoutSession,
  constructStripeEvent,
  handleStripeEvent,
  isStripeConfigured,
} from "./billing";
import { checkQuotaStatus, PLAN_QUOTAS } from "./quotas";
import { getUserProjectCount } from "./subscriptions";
import type { PlanType } from "../types/services";

export const BillingService = {
  getSummary: async (userId: string, projectId?: string | null) => {
    const user = await UserRepository.findByIdWithBilling(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const plan = (user.plan as PlanType) || "free";
    const quotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS];
    const projectCount = await getUserProjectCount(userId);
    const usage = projectId ? await checkQuotaStatus(projectId, plan) : null;

    return {
      plan,
      quotas,
      projectCount,
      usage,
      billingEnabled: isStripeConfigured(),
      billing: {
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeStatus: user.stripeStatus,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      },
    };
  },

  createCheckout: async (userId: string, plan: PlanType) => {
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured");
    }

    const user = await UserRepository.findByIdForCheckout(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const checkout = await createCheckoutSession(user, plan);
    return { url: checkout.url };
  },

  createPortal: async (userId: string) => {
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured");
    }

    const user = await UserRepository.findByIdForPortal(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const portal = await createBillingPortalSession(user);
    return { url: portal.url };
  },

  handleWebhook: async (payload: string, signature: string | undefined) => {
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured");
    }

    const event = constructStripeEvent(payload, signature);
    await handleStripeEvent(event);
    return { received: true };
  },
};

