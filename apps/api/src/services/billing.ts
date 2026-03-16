import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { users } from "../db/schema";
import logger from "../logger";
import type { PlanType } from "../types/services";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO;
const STRIPE_PRICE_TEAM = process.env.STRIPE_PRICE_TEAM;
const STRIPE_PRICE_ENTERPRISE = process.env.STRIPE_PRICE_ENTERPRISE;
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" })
  : null;

const PLAN_PRICE_IDS: Record<PlanType, string | undefined> = {
  free: undefined,
  pro: STRIPE_PRICE_PRO,
  team: STRIPE_PRICE_TEAM,
  enterprise: STRIPE_PRICE_ENTERPRISE,
};

const PRICE_PLAN_MAP = new Map<string, PlanType>(
  Object.entries(PLAN_PRICE_IDS)
    .filter(([, priceId]) => !!priceId)
    .map(([plan, priceId]) => [priceId as string, plan as PlanType])
);

const PAID_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

export function isStripeConfigured(): boolean {
  return !!stripe && !!STRIPE_PRICE_PRO;
}

export function getPriceIdForPlan(plan: PlanType): string | null {
  return PLAN_PRICE_IDS[plan] || null;
}

export function resolvePlanFromPriceId(priceId?: string | null): PlanType {
  if (!priceId) return "free";
  return PRICE_PLAN_MAP.get(priceId) || "free";
}

export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await db
    .update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return customer.id;
}

export async function createCheckoutSession(
  user: {
    id: string;
    email: string;
    name: string | null;
    stripeCustomerId: string | null;
  },
  plan: PlanType
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const priceId = getPriceIdForPlan(plan);
  if (!priceId) {
    throw new Error(`Plan ${plan} is not configured`);
  }

  const customerId = await ensureStripeCustomer(user);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${DASHBOARD_URL}/dashboard?billing=success`,
    cancel_url: `${DASHBOARD_URL}/dashboard?billing=cancel`,
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
    metadata: { userId: user.id, plan },
  });
}

export async function createBillingPortalSession(user: {
  id: string;
  stripeCustomerId: string | null;
}): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!user.stripeCustomerId) {
    throw new Error("Stripe customer not found");
  }

  return stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${DASHBOARD_URL}/dashboard?billing=portal`,
  });
}

export function constructStripeEvent(
  payload: string,
  signature: string | undefined
): Stripe.Event {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const user = (await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId)))[0];

  return user?.id || null;
}

async function updateUserSubscription(params: {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  status: Stripe.Subscription.Status | null;
  currentPeriodEnd?: number | null;
}) {
  const planFromPrice = resolvePlanFromPriceId(params.priceId);
  const isPaid = params.status ? PAID_STATUSES.has(params.status) : false;
  const nextPlan: PlanType = isPaid && planFromPrice !== "free" ? planFromPrice : "free";

  await db
    .update(users)
    .set({
      plan: nextPlan,
      stripeCustomerId: params.customerId,
      stripeSubscriptionId: params.subscriptionId,
      stripePriceId: params.priceId,
      stripeStatus: params.status,
      stripeCurrentPeriodEnd: params.currentPeriodEnd
        ? new Date(params.currentPeriodEnd * 1000)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.userId));

  logger.info("Subscription synced", {
    userId: params.userId,
    plan: nextPlan,
    status: params.status,
  });
}

export async function syncSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  const userId =
    subscription.metadata?.userId ||
    fallbackUserId ||
    (customerId ? await getUserIdByCustomer(customerId) : null);

  if (!userId) {
    logger.warn("Stripe subscription without user mapping", {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id || null;

  await updateUserSubscription({
    userId,
    customerId: customerId || null,
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status,
    currentPeriodEnd: (subscription as any).current_period_end,
  });
}

export async function handleStripeEvent(event: Stripe.Event) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) {
        logger.warn("Checkout session missing subscription", { sessionId: session.id });
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const fallbackUserId =
        session.client_reference_id || session.metadata?.userId || null;

      await syncSubscription(subscription, fallbackUserId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      return;
    }
    default:
      return;
  }
}
