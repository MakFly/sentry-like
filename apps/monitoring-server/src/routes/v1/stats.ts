import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as StatsController from "../../controllers/v1/StatsController";

const router = new Hono();

router.use("*", auth());

router.get("/", asHandler(StatsController.getGlobalStats));
router.get("/dashboard", asHandler(StatsController.getDashboardStats));
router.get("/timeline", asHandler(StatsController.getTimelineStats));
router.get("/env-breakdown", asHandler(StatsController.getEnvBreakdown));

export default router;

