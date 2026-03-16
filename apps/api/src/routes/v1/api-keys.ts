import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ApiKeyController from "../../controllers/v1/ApiKeyController";

const router = new Hono();

router.use("*", auth());

router.get("/", asHandler(ApiKeyController.list));
router.post("/", asHandler(ApiKeyController.create));
router.delete("/:id", asHandler(ApiKeyController.remove));

export default router;

