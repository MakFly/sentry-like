import { Hono } from "hono";
import { apiKeyMiddleware } from "../../middleware/api-key";
import * as EventController from "../../controllers/v1/EventController";

const router = new Hono();

router.post("/", apiKeyMiddleware, EventController.submit);

export default router;

