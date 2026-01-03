import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as ReleaseController from "../../controllers/v1/ReleaseController";

const router = new Hono();

router.post("/", ReleaseController.create); // Can use API key or session
router.get("/", auth(), asHandler(ReleaseController.list));
router.get("/:id", auth(), asHandler(ReleaseController.findById));
router.delete("/:id", auth(), asHandler(ReleaseController.remove));

export default router;

