import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ProjectSettingsController from "../../controllers/v1/ProjectSettingsController";

const router = new Hono();

router.use("*", auth());

router.get("/:projectId", asHandler(ProjectSettingsController.get));
router.patch("/:projectId", asHandler(ProjectSettingsController.update));

export default router;

