import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ExportController from "../../controllers/v1/ExportController";

const router = new Hono();

router.get("/errors", auth(), asHandler(ExportController.exportErrors));
router.get("/performance", auth(), asHandler(ExportController.exportPerformance));

export default router;
