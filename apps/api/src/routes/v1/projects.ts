import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ProjectController from "../../controllers/v1/ProjectController";

const router = new Hono();

router.use("*", auth());

router.get("/", asHandler(ProjectController.getAll));
router.get("/can-create", asHandler(ProjectController.canCreate));
router.post("/", asHandler(ProjectController.create));
router.patch("/:id", asHandler(ProjectController.update));
router.delete("/:id", asHandler(ProjectController.remove));

export default router;

