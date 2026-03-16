import { Hono } from "hono";
import { apiKeyMiddleware } from "../../middleware/api-key";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ReplayController from "../../controllers/v1/ReplayController";

const router = new Hono();

// SDK endpoints (API key auth)
// Error-triggered replay (Sentry-like) - receives error + replay in one request
router.post("/error", apiKeyMiddleware, ReplayController.handleErrorReplay);

// Legacy endpoints (kept for backwards compatibility)
router.post("/session/start", apiKeyMiddleware, ReplayController.startSession);
router.post("/session/events", apiKeyMiddleware, ReplayController.submitEvents);
router.post("/session/end", apiKeyMiddleware, ReplayController.endSession);

// Dashboard endpoints (session auth)
router.get("/sessions", auth(), asHandler(ReplayController.listSessions));
router.get("/sessions-with-errors", auth(), asHandler(ReplayController.listSessionsWithErrors));
router.get("/session/:id", auth(), asHandler(ReplayController.getSession));
router.get("/session/:id/events", auth(), asHandler(ReplayController.getSessionEvents));

export default router;
