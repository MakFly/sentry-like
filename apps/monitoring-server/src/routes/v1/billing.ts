import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as BillingController from "../../controllers/v1/BillingController";

const router = new Hono();

router.get("/summary", auth(), asHandler(BillingController.summary));
router.post("/checkout", auth(), asHandler(BillingController.checkout));
router.post("/portal", auth(), asHandler(BillingController.portal));
router.post("/webhook", BillingController.webhook); // No auth for Stripe

export default router;

