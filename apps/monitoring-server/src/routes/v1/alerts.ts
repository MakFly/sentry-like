import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as AlertController from "../../controllers/v1/AlertController";

const router = new Hono();

router.use("*", auth());

router.get("/", asHandler(AlertController.list));
router.post("/", asHandler(AlertController.create));
router.patch("/:id", asHandler(AlertController.update));
router.delete("/:id", asHandler(AlertController.remove));
router.get("/notifications", asHandler(AlertController.getNotifications));

export default router;

