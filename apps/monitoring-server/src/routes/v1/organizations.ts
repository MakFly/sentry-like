import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as OrganizationController from "../../controllers/v1/OrganizationController";

const router = new Hono();

router.use("*", auth());

router.get("/", asHandler(OrganizationController.getAll));
router.get("/can-create", asHandler(OrganizationController.canCreate));
router.post("/", asHandler(OrganizationController.create));
router.get("/:id", asHandler(OrganizationController.findById));
router.delete("/:id", asHandler(OrganizationController.remove));

export default router;

