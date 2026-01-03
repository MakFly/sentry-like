import type { AuthContext } from "../../types/context";
import type { Context } from "hono";
import { z } from "zod";
import { BillingService } from "../../services/BillingService";
import { verifyProjectAccess } from "../../services/project-access";
import logger from "../../logger";

export const summary = async (c: AuthContext) => {
  const userId = c.get("userId");
  const projectId = c.req.query("projectId");

  if (projectId) {
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  try {
    const result = await BillingService.getSummary(userId, projectId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "User not found") {
      return c.json({ error: "User not found" }, 404);
    }
    logger.error("Failed to get billing summary", { error, userId });
    return c.json({ error: "Failed to get billing summary" }, 500);
  }
};

export const checkout = async (c: AuthContext) => {
  const userId = c.get("userId");

  const schema = z.object({
    plan: z.enum(["pro", "team", "enterprise"]).default("pro"),
  });

  try {
    const input = schema.parse(await c.req.json());
    const result = await BillingService.createCheckout(userId, input.plan);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    if (error.message === "Stripe is not configured") {
      return c.json({ error: "Stripe is not configured" }, 503);
    }
    if (error.message === "User not found") {
      return c.json({ error: "User not found" }, 404);
    }
    logger.error("Failed to create Stripe checkout", { error, userId });
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
};

export const portal = async (c: AuthContext) => {
  const userId = c.get("userId");

  try {
    const result = await BillingService.createPortal(userId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Stripe is not configured") {
      return c.json({ error: "Stripe is not configured" }, 503);
    }
    if (error.message === "User not found" || error.message === "Stripe customer not found") {
      return c.json({ error: error.message }, 404);
    }
    logger.error("Failed to create billing portal session", { error, userId });
    return c.json({ error: "Failed to create billing portal session" }, 500);
  }
};

export const webhook = async (c: Context) => {
  const signature = c.req.header("stripe-signature");
  const payload = await c.req.raw.text();

  try {
    const result = await BillingService.handleWebhook(payload, signature);
    return c.json(result);
  } catch (error: any) {
    logger.error("Stripe webhook error", { error });
    return c.json({ error: "Webhook error" }, 400);
  }
};

