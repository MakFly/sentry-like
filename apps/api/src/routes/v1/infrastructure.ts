import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as InfrastructureController from "../../controllers/v1/InfrastructureController";

const router = new Hono();

router.use("*", auth());

router.get("/hosts", asHandler(InfrastructureController.getHosts));
router.get("/latest", asHandler(InfrastructureController.getLatest));
router.get("/history", asHandler(InfrastructureController.getHistory));
router.get("/stream", asHandler(InfrastructureController.stream));

export default router;
