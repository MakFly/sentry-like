import { Hono } from "hono";
import { apiKeyMiddleware } from "../../middleware/api-key";
import * as MetricsController from "../../controllers/v1/MetricsController";

const router = new Hono();

router.post("/ingest", apiKeyMiddleware, MetricsController.ingest);

export default router;
