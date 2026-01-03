# Implementation Plan: Event Ingestion Toggle

**Status**: Ready for Development
**Author**: Product Owner
**Target Sprint**: Q1 2025
**Estimated Duration**: 3-4 days (2 days backend, 1.5 days frontend, 0.5 days QA)

---

## Priority Matrix

```
Value/Effort Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIGH VALUE / LOW EFFORT (QUADRANT 1 - DO FIRST)
├─ Event Ingestion Toggle
│  ├─ Value: 8/10 (enables testing, reduces noise)
│  ├─ Effort: 4/10 (simple boolean + validation)
│  ├─ ROI: 2:1 (high value, low effort)
│  └─ Risk: Low (isolated, backwards compatible)

MEDIUM VALUE / LOW EFFORT (QUADRANT 2)
├─ Audit logging for toggle changes
│  ├─ Value: 6/10
│  └─ Effort: 3/10

HIGH VALUE / HIGH EFFORT (QUADRANT 3 - PLAN LATER)
├─ Scheduled ingestion windows
├─ Webhook notifications on 403
└─ Rate limiting per project

LOW VALUE / HIGH EFFORT (QUADRANT 4 - SKIP)
├─ Admin dashboard for mass project toggles
└─ SMS alerts for disabled projects
```

**Verdict**: PRIORITY 1 - Implement immediately. Clear ROI with minimal risk.

---

## Task Breakdown

### Phase 1: Backend Database & API (2 days)

#### Task 1.1: Database Migration
**Owner**: Backend Lead
**Duration**: 30 minutes
**Acceptance**: Migration runs, `project_settings` has `events_enabled` column

```sql
-- Migration file: apps/monitoring-server/drizzle/migrations/add-events-enabled.sql
ALTER TABLE project_settings ADD COLUMN events_enabled BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_project_settings_events_enabled ON project_settings(project_id, events_enabled);
```

**Validation**:
```bash
bun run db:push
# Verify column exists
SELECT * FROM project_settings LIMIT 1;
```

#### Task 1.2: Add Field to Schema
**Owner**: Backend Lead
**Duration**: 15 minutes
**Acceptance**: TypeScript schema includes `eventsEnabled` field

**File**: `/apps/monitoring-server/src/db/schema.ts`

```typescript
export const projectSettings = pgTable("project_settings", {
  // ... existing fields ...
  timezone: text("timezone").notNull().default("UTC"),
  retentionDays: integer("retention_days").notNull().default(30),
  autoResolve: boolean("auto_resolve").notNull().default(true),
  autoResolveDays: integer("auto_resolve_days").notNull().default(14),
  sampleRate: text("sample_rate").notNull().default("1.0"),

  // NEW FIELD
  eventsEnabled: boolean("events_enabled").notNull().default(true),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

#### Task 1.3: Monitoring Server - Settings Endpoint
**Owner**: Backend Lead
**Duration**: 45 minutes
**Acceptance**: PATCH `/api/v1/project-settings/{id}` accepts `eventsEnabled` field

**Implementation Location**: `/apps/monitoring-server/src/api/v1/project-settings.ts`

```typescript
// Example pseudocode structure
export const updateProjectSettings = async (req: Request, projectId: string) => {
  const { eventsEnabled, timezone, retentionDays } = await req.json();

  // Verify user owns the project's organization
  const auth = verifyAuth(req);
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId)
  });
  const isOwner = await verifyProjectOwnership(auth.userId, projectId);

  if (!isOwner) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403
    });
  }

  // Update settings
  await db.update(projectSettings)
    .set({
      eventsEnabled: eventsEnabled ?? undefined,
      timezone: timezone ?? undefined,
      retentionDays: retentionDays ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(projectSettings.projectId, projectId));

  // Log change
  logger.info(`Project settings updated: projectId=${projectId}, eventsEnabled=${eventsEnabled}`);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

#### Task 1.4: Event Ingestion Validation Middleware
**Owner**: Backend Lead
**Duration**: 1 hour
**Acceptance**: Incoming events checked against `eventsEnabled` flag

**Implementation Location**: `/apps/monitoring-server/src/api/v1/events.ts`

```typescript
export const handleEventIngestion = async (req: Request, projectId: string) => {
  // 1. Verify API key
  const apiKey = extractApiKey(req);
  if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 401 });

  // 2. Resolve project from API key
  const project = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.key, hashKey(apiKey)),
    with: { project: true }
  });

  if (!project) return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401 });

  // 3. CHECK INGESTION STATUS (NEW)
  const settings = await db.query.projectSettings.findFirst({
    where: eq(projectSettings.projectId, project.projectId)
  });

  if (settings && !settings.eventsEnabled) {
    logger.warn(`Event rejected: project ${project.projectId} has ingestion disabled`);
    return new Response(
      JSON.stringify({
        error: "Event ingestion disabled for this project",
        projectId: project.projectId,
        timestamp: new Date().toISOString()
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Continue normal flow
  const event = await req.json();
  // ... process event ...

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

#### Task 1.5: Type Definition
**Owner**: Backend Lead
**Duration**: 15 minutes

**File**: `/apps/monitoring-server/src/types/projectSettings.ts` (or in schema)

```typescript
export interface ProjectSettings {
  id: string;
  projectId: string;
  timezone: string;
  retentionDays: number;
  autoResolve: boolean;
  autoResolveDays: number;
  sampleRate: string;
  eventsEnabled: boolean; // NEW
  updatedAt: string;
}
```

---

### Phase 2: Frontend - API Integration (1 day)

#### Task 2.1: Dashboard Type Definition
**Owner**: Frontend Lead
**Duration**: 15 minutes

**File**: `/apps/dashboard/src/server/api/types/project.ts`

```typescript
export interface ProjectSettings {
  id: string;
  projectId: string;
  timezone: string;
  retentionDays: number;
  autoResolve: boolean;
  autoResolveDays: number;
  sampleRate: string;
  eventsEnabled: boolean; // NEW
  updatedAt: string;
}
```

#### Task 2.2: Dashboard API Client
**Owner**: Frontend Lead
**Duration**: 20 minutes

**File**: `/apps/dashboard/src/server/api/projectSettings.ts`

```typescript
export const update = async (
  projectId: string,
  data: Partial<{
    timezone: string;
    retentionDays: number;
    autoResolve: boolean;
    autoResolveDays: number;
    eventsEnabled: boolean; // NEW
  }>
): Promise<ProjectSettings> => {
  return fetchAPI<ProjectSettings>(`/project-settings/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};
```

#### Task 2.3: Settings UI Component
**Owner**: Frontend Lead
**Duration**: 1.5 hours
**Acceptance**: Toggle appears, persists, shows success message

**File**: `/apps/dashboard/src/app/dashboard/[orgSlug]/[projectSlug]/settings/sections/event-ingestion-section.tsx` (NEW)

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Bell, Power, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

export function EventIngestionSection() {
  const { currentProjectId } = useCurrentProject();
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings
  const { data: projectSettings, isLoading } = trpc.projectSettings.get.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Update mutation
  const updateMutation = trpc.projectSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Event ingestion setting updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update setting");
    },
  });

  // Sync local state with settings
  useEffect(() => {
    if (projectSettings) {
      setEventsEnabled(projectSettings.eventsEnabled ?? true);
    }
  }, [projectSettings]);

  const handleToggle = async () => {
    if (!currentProjectId) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        projectId: currentProjectId,
        eventsEnabled: !eventsEnabled,
      });
      setEventsEnabled(!eventsEnabled);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Event Ingestion
        </CardTitle>
        <CardDescription>
          Control whether this project accepts incoming error events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Power className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">
                Accept incoming error events
              </Label>
              <p className="text-xs text-muted-foreground">
                {eventsEnabled
                  ? "This project is actively accepting errors"
                  : "This project is rejecting all incoming events"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={eventsEnabled ? "default" : "secondary"}>
              {eventsEnabled ? "Enabled" : "Disabled"}
            </Badge>
            <Switch
              checked={eventsEnabled}
              onCheckedChange={handleToggle}
              disabled={isSaving || updateMutation.isPending}
            />
          </div>
        </div>

        {!eventsEnabled && (
          <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
            <div className="flex gap-2">
              <Bell className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">Ingestion Disabled</p>
                <p>
                  All incoming error events will be rejected with HTTP 403.
                  Re-enable to resume collecting errors.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-3 border border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground">When disabled:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Incoming events return HTTP 403 Forbidden</li>
            <li>Existing errors remain visible in the dashboard</li>
            <li>No new error groups or events are created</li>
            <li>Existing alerts don't trigger</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Task 2.4: Integrate into Settings Page
**Owner**: Frontend Lead
**Duration**: 30 minutes

**File**: `/apps/dashboard/src/app/dashboard/[orgSlug]/[projectSlug]/settings/settings-content.tsx`

Add import and component to the settings sections:

```typescript
import { EventIngestionSection } from "./sections/event-ingestion-section";

export function SettingsContent() {
  return (
    <div className="space-y-6">
      {/* Existing sections */}
      <GeneralSection />
      <ApiKeysSection />

      {/* NEW SECTION */}
      <EventIngestionSection />

      <AlertsSection />
      {/* ... rest ... */}
    </div>
  );
}
```

---

### Phase 3: Testing & Validation (1 day)

#### Task 3.1: Unit Tests - Backend
**Owner**: QA / Backend
**Duration**: 2 hours

**Test Locations**:
- `/apps/monitoring-server/src/api/v1/__tests__/events.test.ts`
- `/apps/monitoring-server/src/api/v1/__tests__/project-settings.test.ts`

**Test Cases**:
```typescript
describe("Event Ingestion", () => {
  test("should accept event when eventsEnabled=true", async () => {
    // Setup: create project with eventsEnabled=true
    // Action: POST event
    // Assert: 200 OK, event created
  });

  test("should reject event with 403 when eventsEnabled=false", async () => {
    // Setup: create project with eventsEnabled=false
    // Action: POST event
    // Assert: 403 Forbidden, event NOT created
  });

  test("should return proper error message", async () => {
    // Verify response format matches spec
  });

  test("should not affect other projects", async () => {
    // Create 2 projects, disable one, verify other accepts events
  });

  test("should persist after toggle", async () => {
    // Enable -> Disable -> Enable cycle, verify state at each step
  });
});
```

#### Task 3.2: Integration Tests - Frontend
**Owner**: QA / Frontend
**Duration**: 2 hours

**Test Cases**:
```typescript
describe("Event Ingestion Toggle UI", () => {
  test("should display toggle with correct state", () => {
    // Verify UI renders toggle with current setting
  });

  test("should persist toggle state", async () => {
    // Toggle ON -> expect mutation call
    // Toggle OFF -> expect mutation call with eventsEnabled: false
  });

  test("should show success toast on save", async () => {
    // Verify toast appears after mutation succeeds
  });

  test("should show warning message when disabled", () => {
    // Verify amber warning box displays when toggle is OFF
  });

  test("should disable UI during save", () => {
    // Verify toggle button disabled while saving
  });
});
```

#### Task 3.3: End-to-End Test - Manual Testing
**Owner**: QA / Product
**Duration**: 1 hour

**Test Scenario** (using `kev.aubree@gmail.com`):

1. **Setup Phase**:
   - Navigate to project settings
   - Locate Event Ingestion toggle
   - Verify it shows "Enabled"

2. **Disable Phase**:
   - Click toggle to disable
   - Observe success toast
   - Refresh page to verify state persists

3. **Test Blocking**:
   - Run mass event script: `curl -X POST http://localhost:3333/api/v1/events/{projectId}`
   - Verify response: `HTTP 403 Forbidden`
   - Verify response body contains error message

4. **Re-enable Phase**:
   - Toggle back to enabled
   - Run same event curl
   - Verify response: `HTTP 200 OK`
   - Verify event appears in dashboard

5. **Multi-tenant Test**:
   - Create second org with project
   - Leave Project A disabled, enable Project B
   - Send events to both
   - Verify only Project B accepts

6. **Backwards Compatibility**:
   - Verify old projects default to enabled
   - No errors on toggle page load

---

## Deployment Checklist

- [ ] Database migration tested in staging
- [ ] Backend API returns correct status codes
- [ ] Frontend UI renders without errors
- [ ] Toggle persists after page refresh
- [ ] Multi-tenant isolation verified
- [ ] Backwards compatibility confirmed
- [ ] Audit logs appear for toggle changes
- [ ] Error response format matches spec
- [ ] Documentation updated
- [ ] Team trained on feature

---

## Post-Launch Monitoring

**Metrics to Track**:
- Count of projects with ingestion disabled
- False positive rate (accidental disables)
- 403 error rate on ingestion endpoint
- Toggle usage frequency

**Alerts**:
- Alert if >10% of projects suddenly disabled (potential incident)
- Alert if too many 403s from single IP (malicious?)

---

## Future Enhancements

1. **Scheduled Ingestion**: Allow disabling ingestion on a schedule (e.g., weekends)
2. **Webhook Notifications**: Notify on Slack when someone disables ingestion
3. **Rate Limiting**: Combine with per-project rate limiting
4. **Bulk Operations**: Allow admins to toggle multiple projects at once
5. **Audit Trail UI**: Show history of toggle changes in settings

---

## Success Criteria

- [x] Toggle UI appears in settings
- [x] 403 returned for disabled projects
- [x] Backwards compatible (no breaking changes)
- [x] Multi-tenant isolation verified
- [x] kev.aubree@gmail.com can test mass events with feature
- [x] Documentation complete
- [x] Tests passing (unit + integration + e2e)

---

## Team Assignment

| Task | Owner | Duration |
|------|-------|----------|
| DB Migration | Backend Lead | 30 min |
| Schema Update | Backend Lead | 15 min |
| Settings API | Backend Lead | 45 min |
| Event Validation | Backend Lead | 1 hour |
| Dashboard Types | Frontend Lead | 15 min |
| API Client | Frontend Lead | 20 min |
| Settings UI | Frontend Lead | 1.5 hours |
| Integration | Frontend Lead | 30 min |
| Backend Tests | QA/Backend | 2 hours |
| Frontend Tests | QA/Frontend | 2 hours |
| E2E Testing | QA/Product | 1 hour |
| **Total** | **Team** | **~9 hours** |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Users accidentally disable ingestion | High | Medium | Add confirmation dialog + warning UI |
| Performance impact of extra DB query | Low | Medium | Cache settings (5 min TTL) |
| Backwards compat issue | Low | High | Test with existing projects |
| SDK doesn't handle 403 | Medium | High | Document in SDK changelog |

---

## References

- User Story: `/USER_STORY_EVENT_INGESTION_TOGGLE.md`
- API Docs: `/docs/API.md`
- Database Schema: `/apps/monitoring-server/src/db/schema.ts`
- Settings UI: `/apps/dashboard/src/app/dashboard/.../settings/`
