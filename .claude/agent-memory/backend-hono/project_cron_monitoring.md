---
name: cron_monitoring_feature
description: Cron Monitoring feature implementation details — tables, routes, worker, alert integration
type: project
---

Implemented full Cron Monitoring feature (branch fix/security-audit-phase1).

**Why:** Provide a Sentry-like cron job health monitoring with auto-create monitors, in_progress/ok/error checkins, missed detection, and alert integration.

**How to apply:** When extending cron monitoring (e.g. adding dashboard UI routes, SDK docs), these are the relevant files:
- Schema: `apps/api/src/db/schema.ts` — tables `cron_monitors` and `cron_checkins`
- Repository: `apps/api/src/repositories/CronRepository.ts`
- Service: `apps/api/src/services/CronService.ts` — uses `cron-parser` v5 (`CronExpressionParser.parse`)
- Controller: `apps/api/src/controllers/v1/CronController.ts`
- Routes: `apps/api/src/routes/v1/cron.ts` — mounted at `/api/v1/cron`
- Worker: `apps/api/src/queue/workers/cron-monitor.worker.ts` — runs every minute, detects overdue monitors
- Alert type: `"cron_missed"` added to `AlertRuleType` in `types/services.ts`
- Email: `sendCronMissedAlertEmail` added to `services/email.ts`

SDK endpoint: `POST /api/v1/cron/checkin` (X-API-Key auth, open CORS).
Dashboard endpoints: `GET/POST /api/v1/cron/monitors`, `GET/PATCH/DELETE /api/v1/cron/monitors/:id`, plus `/checkins` and `/timeline` sub-routes (session auth).
