---
name: Pre-existing TypeScript errors in apps/api
description: Three TypeScript errors exist in apps/api before any alert channel work — do not flag these as regressions
type: project
---

As of 2026-03-16, `bunx tsc --noEmit` in `apps/api/` reports 3 pre-existing errors unrelated to alert channel work:

1. `src/controllers/v1/EventController.ts(86,31)` — `number` not assignable to `string`
2. `src/services/api-keys.ts(37,31)` — `string | undefined` not assignable to `BinaryLike | KeyObject`
3. `src/services/CronService.ts(4,10)` — `triggerAlertsForCronError` not exported from `./alerts` (likely another parallel task's pending work)

**Why:** These errors were present before any alert channel modifications. They are not regressions introduced by new code.

**How to apply:** When running `tsc --noEmit` to verify alert channel work, ignore these 3 errors. Only fail if new errors appear in the files we own (`types/services.ts`, `controllers/v1/AlertController.ts`, `services/AlertService.ts`, `services/alerts.ts`).
