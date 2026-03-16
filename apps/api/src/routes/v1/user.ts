import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as UserProfileController from "../../controllers/v1/UserProfileController";

const router = new Hono();

router.use("*", auth());

router.get("/profile", asHandler(UserProfileController.getProfile));
router.patch("/profile", asHandler(UserProfileController.updateProfile));
router.get("/sessions", asHandler(UserProfileController.getSessions));
router.delete("/sessions/:sessionId", asHandler(UserProfileController.revokeSession));
router.delete("/sessions", asHandler(UserProfileController.revokeAllSessions));
router.get("/can-change-password", asHandler(UserProfileController.canChangePassword));

export default router;
