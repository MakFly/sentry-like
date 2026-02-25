import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { users } from "../db/schema";

export const UserRepository = {
  findById: (id: string) =>
    db.select().from(users).where(eq(users.id, id)).then(rows => rows[0]),

  findByEmail: (email: string) =>
    db.select().from(users).where(eq(users.email, email)).then(rows => rows[0]),

  create: (data: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) =>
    db.insert(users).values({
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }).returning().then(rows => rows[0]),

  findByIdWithBilling: (id: string) =>
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        stripeStatus: users.stripeStatus,
        stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]),

  findByIdForCheckout: (id: string) =>
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]),

  findByIdForPortal: (id: string) =>
    db
      .select({
        id: users.id,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]),

  findByStripeCustomerId: (customerId: string) =>
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .then(rows => rows[0]),

  updateStripeCustomer: (id: string, customerId: string) =>
    db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      ,

  updateSubscription: (params: {
    userId: string;
    customerId: string | null;
    subscriptionId: string | null;
    priceId: string | null;
    status: string | null;
    currentPeriodEnd: Date | null;
    plan: string;
  }) =>
    db
      .update(users)
      .set({
        plan: params.plan,
        stripeCustomerId: params.customerId,
        stripeSubscriptionId: params.subscriptionId,
        stripePriceId: params.priceId,
        stripeStatus: params.status,
        stripeCurrentPeriodEnd: params.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))
      ,
};

