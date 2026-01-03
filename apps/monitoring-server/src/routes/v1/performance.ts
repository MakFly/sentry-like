import { Hono } from "hono";
import { apiKeyMiddleware } from "../../middleware/api-key";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as PerformanceController from "../../controllers/v1/PerformanceController";

const router = new Hono();

// SDK endpoints (API key auth)
router.post("/metrics", apiKeyMiddleware, PerformanceController.submitMetrics);
router.post("/transaction", apiKeyMiddleware, PerformanceController.submitTransaction);

// Dashboard endpoints (session auth)
router.get("/metrics", auth(), asHandler(PerformanceController.getMetrics));
router.get("/web-vitals", auth(), asHandler(PerformanceController.getWebVitalsSummary));
router.get("/transactions", auth(), asHandler(PerformanceController.getTransactions));
router.get("/transactions/:id", auth(), asHandler(PerformanceController.getTransaction));
router.get("/slowest", auth(), asHandler(PerformanceController.getSlowestTransactions));

export default router;
