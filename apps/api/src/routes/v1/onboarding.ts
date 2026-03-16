import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as OnboardingController from "../../controllers/v1/OnboardingController";

const router = new Hono();

router.use("*", auth());

router.get("/status", asHandler(OnboardingController.getStatus));
router.post("/setup", asHandler(OnboardingController.setup));

export default router;

