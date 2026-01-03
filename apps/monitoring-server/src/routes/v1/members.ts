import { Hono } from "hono";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as MemberController from "../../controllers/v1/MemberController";

const router = new Hono();

router.use("*", auth());

router.get("/organization/:organizationId", asHandler(MemberController.getByOrganization));
router.post("/invite", asHandler(MemberController.invite));
router.get("/check/:token", asHandler(MemberController.checkInvite));
router.post("/accept", asHandler(MemberController.acceptInvite));
router.delete("/:id", asHandler(MemberController.remove));

export default router;

