import { Hono } from "hono";
import { adminAuth } from "../../middleware/admin-auth";
import * as AdminController from "../../controllers/v1/AdminController";

const router = new Hono();

router.use("*", adminAuth());

router.get("/retention/stats", AdminController.getRetentionStats);
router.post("/retention/cleanup", AdminController.runRetentionCleanup);
router.post("/groups/update-counts", AdminController.updateGroupCounts);
router.get("/quota/project/:projectId", AdminController.getProjectQuota);
router.get("/quota/organization/:organizationId", AdminController.getOrganizationQuota);

// Cron / Aggregation management
router.get("/cron/status", AdminController.getCronStatus);
router.post("/cron/trigger", AdminController.triggerCronJob);
router.post("/cron/run-sync", AdminController.runCronSync);
router.get("/cron/failed", AdminController.getFailedCronJobs);
router.delete("/cron/failed", AdminController.clearFailedCronJobs);

export default router;

