# User Story: Event Ingestion Toggle per Project

**Epic**: Project Configuration & Control
**Priority**: High
**Complexity**: Medium (4-5 story points)

---

## Summary

As a project owner, I want to be able to disable/enable event ingestion for a specific project so that I can control which projects accept error events (useful for testing, staging, or temporarily pausing error collection).

---

## Description

Currently, all projects accept error events without the ability to selectively disable ingestion. This feature adds a per-project toggle in the settings UI that:

1. **UI Side** (Dashboard): Adds a toggle switch in project settings
2. **Backend Side** (Monitoring Server): Validates the toggle state on incoming events
3. **Multi-tenant**: Toggle is per-project (not org-wide)
4. **Error Handling**: Returns HTTP 403 when disabled

### Use Case Examples

- Test mass event ingestion without cluttering real data
- Pause error collection during maintenance
- Temporarily disable a staging project to reduce storage
- Quick toggle when investigating data quality issues

---

## Acceptance Criteria

### AC-1: Database Schema
**Given** the project settings table exists
**When** a new project is created
**Then** it should have an `eventsEnabled` boolean field defaulting to `true`

```sql
ALTER TABLE project_settings ADD COLUMN events_enabled BOOLEAN NOT NULL DEFAULT true;
```

### AC-2: Dashboard Settings UI
**Given** I'm viewing project settings at `/dashboard/[orgSlug]/[projectSlug]/settings/`
**When** I look for the event ingestion control
**Then** I should see a toggle switch in a new **"Event Ingestion"** card/section with:
- Toggle label: "Accept incoming error events"
- Description: "Disable to block all incoming error events for this project"
- State indicator (enabled/disabled)
- Save button that updates the backend

**And** the toggle state should match the backend value on page load

### AC-3: tRPC Integration (Dashboard Server)
**Given** I want to fetch/update the event ingestion setting
**When** I call `projectSettings.update()` with `eventsEnabled` field
**Then** it should:
- Accept `eventsEnabled?: boolean` in the update payload
- Send the request to `/project-settings/{projectId}` PATCH endpoint
- Reflect the change immediately in the UI (mutation + cache refetch)
- Show a success toast when saved

### AC-4: Monitoring Server - Event Validation
**Given** an incoming event request to `POST /api/v1/event/{projectId}`
**When** the project has `events_enabled = false`
**Then** the API should:
- Return **HTTP 403 Forbidden**
- Include error body: `{ "error": "Event ingestion disabled for this project" }`
- **NOT** create error groups or events in the database
- Log the rejection (warning level): `Event rejected: project {projectId} has ingestion disabled`

### AC-5: Existing Events Behavior
**Given** a project has ingestion disabled
**When** I query for existing errors
**Then** they should still be visible in the dashboard (only new events are blocked)

**And** when re-enabling, new events should start flowing in immediately

### AC-6: Backwards Compatibility
**Given** an existing project created before this feature
**When** the database migration runs
**Then** all projects should default to `eventsEnabled: true` (no breaking change)

### AC-7: Multi-tenant Isolation
**Given** two organizations with projects (OrgA/ProjectX, OrgB/ProjectY)
**When** ProjectX has ingestion disabled but ProjectY is enabled
**Then** events should be rejected for ProjectX only, and accepted for ProjectY

**And** a user from OrgA cannot see/modify OrgB's project settings

### AC-8: Error Response Format (API Contract)
**Given** a disabled project receives an event
**When** returning 403
**Then** the response body should match:
```json
{
  "error": "Event ingestion disabled for this project",
  "projectId": "proj_xxx",
  "timestamp": "2025-12-29T10:30:00Z"
}
```

### AC-9: Testing Scenario
**Given** user `kev.aubree@gmail.com` with a test project
**When** they toggle event ingestion OFF
**Then** their mass event script should receive 403 responses
**And** toggling back ON should resume accepting events

### AC-10: Audit & Logging
**Given** a project owner toggles ingestion
**When** the toggle is changed
**Then** the backend should log:
```
[INFO] Project settings updated: projectId={id}, eventsEnabled={true|false}, by={userId}
```

---

## Technical Breakdown

### Files to Modify

#### 1. Database Schema (Monitoring Server)
- **File**: `/apps/monitoring-server/src/db/schema.ts`
- **Change**: Add `eventsEnabled` boolean field to `projectSettings` table

#### 2. Monitoring Server - Settings API
- **File**: `/apps/monitoring-server/src/api/v1/project-settings.ts` (or similar)
- **Change**:
  - Update PATCH handler to accept `eventsEnabled` field
  - Validate permissions (user owns the project's org)

#### 3. Monitoring Server - Event Ingestion Endpoint
- **File**: `/apps/monitoring-server/src/api/v1/events.ts` (or similar)
- **Change**:
  - Before processing event, fetch project settings
  - Check `eventsEnabled` flag
  - Return 403 if disabled
  - Continue normal flow if enabled

#### 4. Dashboard - ProjectSettings Type
- **File**: `/apps/dashboard/src/server/api/types/project.ts`
- **Change**: Add `eventsEnabled` to `ProjectSettings` interface

#### 5. Dashboard - ProjectSettings API
- **File**: `/apps/dashboard/src/server/api/projectSettings.ts`
- **Change**:
  - Add `eventsEnabled?: boolean` to update payload
  - Include it in the request to monitoring server

#### 6. Dashboard - Settings UI
- **File**: `/apps/dashboard/src/app/dashboard/[orgSlug]/[projectSlug]/settings/sections/general-section.tsx` OR create new `event-ingestion-section.tsx`
- **Change**:
  - Add toggle control for event ingestion
  - Wire up state management + mutation calls
  - Add visual indicator for on/off state

#### 7. Database Migration (Monitoring Server)
- **File**: Create migration file or use schema push
- **Change**:
  ```sql
  ALTER TABLE project_settings ADD COLUMN events_enabled BOOLEAN NOT NULL DEFAULT true;
  ```

---

## Priority & Effort Matrix

| Aspect | Score |
|--------|-------|
| **Business Value** | 8/10 (Enables testing & control for power users) |
| **User Impact** | 7/10 (Quality-of-life feature) |
| **Implementation Effort** | 4/10 (Straightforward CRUD + validation) |
| **Risk** | 2/10 (No breaking changes, simple boolean flag) |
| **Dependencies** | 0/10 (No external dependencies) |

**Recommendation**: HIGH PRIORITY - Implement in next sprint. Enables testing workflows and provides project-level control.

---

## Testing Checklist

- [ ] Toggle UI appears and persists on settings page
- [ ] Disabled project returns 403 for new events
- [ ] Enabled project accepts events normally
- [ ] Old events remain visible when ingestion is disabled
- [ ] Re-enabling allows new events to flow
- [ ] Multi-tenant isolation verified
- [ ] Backwards compatibility tested (existing projects default to enabled)
- [ ] Audit logs capture toggle changes
- [ ] Mass event test with kev.aubree@gmail.com succeeds/fails as expected
- [ ] Mobile/responsive UI verified

---

## Rollout Plan

1. **Phase 1 (Internal)**: Deploy to staging, test with mass events
2. **Phase 2 (Beta)**: Gradual rollout to select orgs
3. **Phase 3 (GA)**: Full rollout with documentation

---

## Related Issues

- Parent epic: Project Configuration & Control
- Related: API keys management, alert rules, retention settings
- Blocks: Testing workflows for mass event ingestion

---

## Notes

- This feature pairs well with the planned **"batch event import"** feature
- Consider future enhancement: schedule-based ingestion (e.g., disable during business hours)
- API response should be consistent with Sentry's 403 format for SDK compatibility
