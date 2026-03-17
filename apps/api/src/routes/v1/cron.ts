import { Hono } from "hono";
import { apiKeyMiddleware } from "../../middleware/api-key";
import { auth } from "../../middleware/auth";
import { asHandler } from "../helpers";
import * as CronController from "../../controllers/v1/CronController";

const cron = new Hono();

// SDK endpoint (API key auth) — open CORS configured in index.ts
cron.post("/checkin", apiKeyMiddleware, CronController.checkin);

// Dashboard endpoints (session auth)
cron.use("/monitors*", auth());
cron.get("/monitors", asHandler(CronController.listMonitors));
cron.post("/monitors", asHandler(CronController.createMonitor));
cron.get("/monitors/:id", asHandler(CronController.getMonitor));
cron.patch("/monitors/:id", asHandler(CronController.updateMonitor));
cron.delete("/monitors/:id", asHandler(CronController.deleteMonitor));
cron.get("/monitors/:id/checkins", asHandler(CronController.getCheckins));
cron.get("/monitors/:id/timeline", asHandler(CronController.getTimeline));

export default cron;
