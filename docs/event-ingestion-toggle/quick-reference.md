# Quick Reference Guide - Event Ingestion Toggle

**TL;DR**: Add a toggle in project settings to disable/enable event ingestion. When disabled, API returns 403.

---

## 1-Minute Overview

```
What?    Toggle in settings to enable/disable event ingestion
Where?   /dashboard/[orgSlug]/[projectSlug]/settings
Why?     Allows testing mass events without cluttering production data
How?     Simple boolean flag in database + API validation
Value?   8/10 (enables user workflows)
Effort?  4/10 (straightforward implementation)
ROI?     2.0x (high value-to-effort ratio)
Risk?    Low (no breaking changes)
```

---

## User Story Summary

**As a** project owner
**I want to** disable event ingestion for my project
**So that** I can control which projects accept errors (for testing, staging, or maintenance)

**Acceptance**: Toggle in UI + HTTP 403 when disabled

---

## Key Files to Modify

| Layer | File | Change |
|-------|------|--------|
| **DB** | `/apps/monitoring-server/src/db/schema.ts` | Add `eventsEnabled: boolean` |
| **Backend** | `/apps/monitoring-server/src/api/v1/*` | Return 403 if disabled |
| **Type** | `/apps/dashboard/src/server/api/types/project.ts` | Add `eventsEnabled` field |
| **Frontend** | `/apps/dashboard/src/app/.../settings/sections/*` | Create toggle UI |

---

## Database Change

```sql
ALTER TABLE project_settings ADD COLUMN events_enabled BOOLEAN NOT NULL DEFAULT true;
```

Or in Drizzle:

```typescript
export const projectSettings = pgTable("project_settings", {
  // ... existing fields ...
  eventsEnabled: boolean("events_enabled").notNull().default(true),
  // ... rest of fields ...
});
```

---

## API Changes Summary

### Monitoring Server: Settings Endpoint (PATCH)

**Before**:
```
/api/v1/project-settings/{id}
PATCH { timezone: "UTC", retentionDays: 30 }
```

**After**:
```
/api/v1/project-settings/{id}
PATCH { timezone: "UTC", retentionDays: 30, eventsEnabled: false }
Response: 200 OK { eventsEnabled: false, ... }
```

### Monitoring Server: Event Ingestion Endpoint (POST)

**Before**:
```
/api/v1/events
POST { message: "Error!", stack: "..." }
Response: 200 OK (if valid)
```

**After**:
```
/api/v1/events
POST { message: "Error!", stack: "..." }
Response: 200 OK (if valid AND eventsEnabled=true)
Response: 403 Forbidden { error: "Event ingestion disabled..." } (if eventsEnabled=false)
```

---

## Frontend Changes Summary

### UI Component Pseudo-Code

```typescript
export function EventIngestionSection() {
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const { data: settings } = trpc.projectSettings.get.useQuery({ projectId });
  const updateMutation = trpc.projectSettings.update.useMutation();

  const handleToggle = async () => {
    await updateMutation.mutateAsync({
      projectId,
      eventsEnabled: !eventsEnabled
    });
    setEventsEnabled(!eventsEnabled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Ingestion</CardTitle>
        <CardDescription>Control event acceptance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label>Accept incoming error events</Label>
          <Switch
            checked={eventsEnabled}
            onCheckedChange={handleToggle}
          />
          <Badge>{eventsEnabled ? "Enabled" : "Disabled"}</Badge>
        </div>
        {!eventsEnabled && (
          <div className="mt-4 p-3 bg-warning/10 rounded text-sm">
            Events are currently being rejected (HTTP 403)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Testing Checklist

```
Quick Test Scenarios:
═════════════════════════════════════════════════════════════

✓ UI Appears
  1. Go to project settings
  2. See "Event Ingestion" section with toggle
  3. Toggle shows current state (enabled/disabled)

✓ Toggle Persists
  1. Toggle OFF
  2. Refresh page
  3. Toggle still shows OFF
  4. Check database: eventsEnabled = false

✓ Blocks Events When Disabled
  1. Toggle OFF
  2. curl -X POST http://localhost:3333/api/v1/events -d '...'
  3. Response: 403 Forbidden
  4. Check DB: no new error created

✓ Accepts Events When Enabled
  1. Toggle ON
  2. Same curl request
  3. Response: 200 OK
  4. Check DB: error created

✓ Multi-Tenant (2+ projects)
  1. Project A disabled, Project B enabled
  2. Send events to both
  3. A gets 403, B gets 200
  4. Verify isolation
```

---

## Error Response Format

```json
HTTP 403 Forbidden
{
  "error": "Event ingestion disabled for this project",
  "projectId": "proj_abc123",
  "timestamp": "2025-12-29T10:30:00Z"
}
```

---

## Code Snippets

### Backend Event Validation (Pseudocode)

```typescript
// In event ingestion handler
const settings = await getProjectSettings(projectId);

if (!settings.eventsEnabled) {
  logger.warn(`Event rejected: project ${projectId} disabled`);
  return new Response(
    JSON.stringify({
      error: "Event ingestion disabled for this project",
      projectId,
      timestamp: new Date().toISOString()
    }),
    { status: 403 }
  );
}

// Continue normal event processing...
```

### Frontend Toggle Hook

```typescript
const { data: settings } = trpc.projectSettings.get.useQuery(
  { projectId: currentProjectId! },
  { enabled: !!currentProjectId }
);

const updateMutation = trpc.projectSettings.update.useMutation({
  onSuccess: () => toast.success("Setting saved")
});

const toggleEvents = async () => {
  await updateMutation.mutateAsync({
    projectId: currentProjectId,
    eventsEnabled: !settings.eventsEnabled
  });
};
```

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Backend** | 2 days | DB + API + validation |
| **Frontend** | 1.5 days | UI component + integration |
| **Testing** | 1 day | Unit + integration + e2e |
| **Total** | ~4.5 days | Ready for production |

---

## Talking Points (for Stakeholders)

**For Users**:
- "Control which projects accept errors"
- "Test mass event ingestion without noise"
- "Temporarily pause error collection"

**For Engineers**:
- "Simple boolean flag + validation"
- "Backwards compatible (defaults to enabled)"
- "No performance impact (cached settings)"

**For Product**:
- "Feature parity with Sentry"
- "High-value, low-effort feature"
- "Enables advanced user workflows"

---

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| Users accidentally disable | Add confirmation dialog |
| Performance degradation | Cache settings (5-min TTL) |
| SDK incompatibility | Document in release notes |
| Backwards compat break | Test with existing DBs |
| Accidental data loss | Disabled projects show old data |

---

## Success Metrics

```
After launch, track:

✓ Feature adoption: % of projects with toggle accessed
✓ Toggle usage: times disabled/enabled per day
✓ User satisfaction: NPS from feature requesters
✓ API metrics: 403 response rate (should be low)
✓ Support impact: fewer "can I disable?" support tickets
```

---

## Related Documentation

- Full User Story: `USER_STORY_EVENT_INGESTION_TOGGLE.md`
- Implementation Plan: `IMPLEMENTATION_PLAN_EVENT_TOGGLE.md`
- BDD Acceptance Criteria: `ACCEPTANCE_CRITERIA_BDD.md`
- Priority Matrix: `PRIORITY_MATRIX.md`
- This file: `QUICK_REFERENCE_EVENT_TOGGLE.md`

---

## Developer Checklist

```
Before Starting Development:
☐ Read full user story
☐ Review acceptance criteria (BDD format)
☐ Understand database schema
☐ Know the existing API patterns
☐ Familiar with tRPC setup
☐ Understand multi-tenant architecture

During Development:
☐ Follow existing code patterns
☐ Write unit tests as you go
☐ Add type definitions first
☐ Test backwards compatibility
☐ Verify multi-tenant isolation
☐ Check authorization on API

Before QA:
☐ All unit tests passing
☐ Code review completed
☐ Tested manually in dev environment
☐ No console warnings/errors
☐ Documentation updated

After QA Sign-Off:
☐ All acceptance criteria verified
☐ Performance benchmarks met
☐ Security review passed
☐ Ready for production deployment
```

---

## Production Deployment

```bash
# Step 1: Database migration
bun run db:push

# Step 2: Deploy backend (monitoring-server)
docker build -t errorwatch-api:v1.2.0 .
docker push errorwatch-api:v1.2.0

# Step 3: Deploy frontend (dashboard)
npm run build
docker build -t errorwatch-dashboard:v1.2.0 .
docker push errorwatch-dashboard:v1.2.0

# Step 4: Verify
curl http://api.example.com/health  # Should return 200
curl https://example.com/settings   # Should load toggle

# Step 5: Monitor
tail -f logs/api.log  # Watch for 403 rejections
```

---

## Rollback Plan

If something goes wrong:

```sql
-- Remove column (if needed)
ALTER TABLE project_settings DROP COLUMN events_enabled;

-- Or reset to all enabled (simpler)
UPDATE project_settings SET events_enabled = true;
```

Frontend rollback:
- Comment out EventIngestionSection from settings layout
- Redeploy dashboard

---

## Questions & Answers

**Q: Will existing projects break?**
A: No. They default to `eventsEnabled=true`, so behavior is unchanged.

**Q: What if someone disables and forgets to enable?**
A: Their events get rejected (403). They can re-enable anytime. Toggle is visible in settings.

**Q: How does this affect API rate limits?**
A: No impact. 403 is returned before any processing, so it's actually faster.

**Q: Can I see which projects are disabled?**
A: Future feature: Dashboard view showing all projects + their ingestion status.

**Q: What about webhooks/alerts when disabled?**
A: Disabled projects don't receive new events, so alerts won't trigger (expected behavior).

---

## Contact & Support

**Questions about this feature?**
- Product Owner: For requirements clarification
- Backend Lead: For API/DB questions
- Frontend Lead: For UI questions
- QA: For testing approach

**Need to implement?**
1. Read the full user story first
2. Review acceptance criteria (BDD format)
3. Check implementation plan for task breakdown
4. Use this quick reference for quick lookups

---

**Last Updated**: 2025-12-29
**Status**: Ready for Development
**Next Action**: Create sprint story and assign team
