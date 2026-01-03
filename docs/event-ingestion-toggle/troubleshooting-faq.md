# Troubleshooting & FAQ - Event Ingestion Toggle

**Last Updated**: 2025-12-29
**Maintainer**: Product Team
**Version**: 1.0

---

## Frequently Asked Questions

### User Questions

#### Q1: I toggled events OFF. How do I turn it back ON?

**A**: Navigate to your project settings and click the toggle to enable.

Path: `/dashboard/[orgSlug]/[projectSlug]/settings`
Section: Event Ingestion
Action: Click toggle to enable

If you can't find it, check:
- Are you on the correct project?
- Are you the project owner?
- Is the page loading completely?

---

#### Q2: When events are disabled, do my old errors disappear?

**A**: No. Disabling ingestion only blocks NEW events. All historical errors remain visible.

Timeline:
- Events before disable: Still visible
- Events while disabled: Rejected (HTTP 403)
- Events after re-enabling: Accepted again

---

#### Q3: Can I disable events for multiple projects at once?

**A**: Not yet. You need to toggle each project individually. Bulk operations are planned for a future release.

---

#### Q4: What happens to alerts when events are disabled?

**A**: Alerts don't trigger because no new events are created. Rules remain configured but inactive.

When you re-enable:
- Rules activate immediately
- Alerts resume triggering
- No backlog of alerts

---

#### Q5: Can members toggle event ingestion or only owners?

**A**: Only project owners can toggle. Team members see the toggle but can't change it.

---

### Developer Questions

#### Q6: My SDK gets 403 when sending events. What's wrong?

**A**: Your project has event ingestion disabled.

Check: `/dashboard/[orgSlug]/[projectSlug]/settings`
Look for "Event Ingestion" section
If toggle shows "Disabled" - that's the issue

Fix: Toggle to "Enabled" and retry

---

#### Q7: How do I disable events for testing without affecting production?

**A**: Create a separate "staging" or "test" project:

1. Create new project: "MyApp Staging"
2. Get its API key
3. Use API key in staging environment
4. Toggle ingestion ON/OFF as needed
5. Keep production project untouched

---

#### Q8: What's the performance impact?

**A**: Minimal. Settings are cached (5-minute TTL), check is < 5ms.

Performance impact: Less than 1% latency increase.

---

#### Q9: If I disable and re-enable quickly, will I lose any events?

**A**: Yes. Events during the disabled period are rejected (HTTP 403).

This is expected behavior. If you need those events, use a separate project or keep ingestion enabled.

---

### Operations Questions

#### Q10: How do I monitor event rejections?

**A**: Check monitoring server logs:

```bash
tail -f logs/monitoring-server.log | grep "403"
tail -f logs/monitoring-server.log | grep "ingestion_disabled"
```

---

#### Q11: Should we alert on high 403 error rates?

**A**: Depends on your use case.

High 403 = Normal when:
- Testing events intentionally
- Mass event ingestion test
- Load testing

High 403 = Alert when:
- Unexpected 403s from production
- Sudden spike (indicates accidental disable)

---

#### Q12: How do I verify the feature works in production?

**A**: Run this test:

```bash
PROJECT_ID="proj_abc123"

# Check current settings
curl -X GET "https://api.example.com/api/v1/project-settings/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"

# Disable events
curl -X PATCH "https://api.example.com/api/v1/project-settings/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventsEnabled": false}'

# Try to send event (should return 403)
curl -X POST "https://api.example.com/api/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","stack":"...","env":"prod"}'
```

---

## Troubleshooting Guide

### Problem 1: Toggle Doesn't Appear in Settings

**Symptoms**:
- Settings page loads
- No "Event Ingestion" section visible
- Other sections appear fine

**Diagnosis**:
1. Is the frontend deployed?
2. Is the backend running?
3. Are you the project owner?

**Fixes**:

```bash
# Check frontend is deployed
curl https://dashboard.example.com/ | grep -i "ingestion"

# Check backend is running
curl https://api.example.com/api/v1/health

# Verify you're the owner
curl https://api.example.com/api/v1/projects/current \
  -H "Authorization: Bearer $TOKEN"
```

---

### Problem 2: Toggle Shows But Won't Save

**Symptoms**:
- Toggle is visible
- Clicking does nothing
- No toast appears

**Diagnosis**:
1. Network issue (request not sent)
2. Authentication issue (401/403)
3. Server error (500)

**Fixes**:

Check network tab in DevTools. You should see:
- Request: PATCH /api/v1/project-settings/{id}
- Response: 200 OK

Or manually test:

```bash
curl -X PATCH "https://api.example.com/api/v1/project-settings/proj_xxx" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventsEnabled": false}' \
  -v
```

---

### Problem 3: Getting 403 When Submitting Events

**Symptoms**:
- Event submission fails
- Response: HTTP 403 Forbidden
- Message: "Event ingestion disabled..."

**This is working as designed!** Event ingestion is intentionally disabled.

**To fix**:
1. Go to project settings
2. Enable "Event Ingestion" toggle
3. Retry event submission
4. Should now get 200 OK

---

### Problem 4: Old Events Disappeared After Toggling

**Symptoms**:
- Had 100 errors before
- Toggled events to disabled
- Now dashboard shows 0 errors

**Unlikely but possible issues**:
1. Browser cache (refresh the page)
2. Viewing wrong project (check URL)
3. Data retention kicked in
4. Database issue (check logs)

**Fix**: Refresh page (F5). If still missing, check backend logs.

---

### Problem 5: Migration Failed During Deployment

**Symptoms**:
- Deployment failed
- Error: "Column already exists"

**Diagnosis**: Database migration conflict.

**Fixes**:

```sql
-- Check if column exists
SELECT * FROM project_settings LIMIT 1;

-- If column exists, skip migration
-- Column is already there
```

---

### Problem 6: Settings Load But Show Wrong State

**Symptoms**:
- Toggle shows "Enabled"
- But events are rejected
- Or toggle shows "Disabled" but events accepted

**Cause**: Cache mismatch.

**Fix**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh page (Ctrl+Shift+R)
3. Check backend database

---

## Error Messages Explained

### "Event ingestion disabled for this project"

Status: 403 Forbidden
Meaning: Project has eventsEnabled = false
Action: Toggle to enabled in settings

---

### "Only project owners can modify settings"

Status: 403 Forbidden
Meaning: Only project owner can toggle
Action: Ask owner to toggle, or request owner role

---

### "Project not found"

Status: 404 Not Found
Meaning: Project ID doesn't exist
Action: Check project ID, verify you're in right org

---

### "Authentication required"

Status: 401 Unauthorized
Meaning: API key/session expired
Action: Provide valid token or log in again

---

### "Invalid value for field 'eventsEnabled'"

Status: 400 Bad Request
Meaning: Must be boolean (true/false)
Action: Check request body

---

## Testing Checklist

### Pre-Launch Checklist

- [ ] Toggle appears in settings UI
- [ ] Toggle state persists after refresh
- [ ] API returns correct codes (200, 403)
- [ ] Error message shows when disabled
- [ ] Old events visible when disabled
- [ ] Multi-tenant isolation works
- [ ] Performance acceptable
- [ ] Backwards compatibility verified
- [ ] Authorization checks pass

### Post-Launch Checklist

- [ ] Monitor 403 error rates
- [ ] Watch for user support tickets
- [ ] Document in release notes
- [ ] SDK authors aware of 403

---

## Rollback Instructions

If something goes wrong:

### Quick Rollback (5 minutes)

```sql
-- Revert database to all enabled
UPDATE project_settings SET events_enabled = true;

-- Restart monitoring server
systemctl restart monitoring-server

-- Verify
curl https://api.example.com/api/v1/health
```

---

## Performance Tuning

### If You See Latency Issues

1. Check cache settings - increase TTL if needed
2. Verify database indexes exist
3. Monitor slow queries in logs

---

## Monitoring Queries

### Find Disabled Projects

```sql
SELECT
  p.id,
  p.name,
  ps.events_enabled,
  ps.updated_at
FROM projects p
LEFT JOIN project_settings ps ON p.id = ps.project_id
WHERE ps.events_enabled = false
ORDER BY ps.updated_at DESC;
```

---

## Getting Help

### Where to Report Issues

Bug: Create GitHub issue with:
- Steps to reproduce
- Expected vs actual
- Browser/environment info
- Screenshots if UI issue

Question: Check this FAQ, then:
- Comment on user story
- Post in Slack
- Email support

Performance: Contact ops team with:
- Affected project IDs
- Time range
- Error logs
- Metrics

---

## Additional Resources

- Feature Docs: USER_STORY_EVENT_INGESTION_TOGGLE.md
- API Reference: API_CONTRACTS_EVENT_TOGGLE.md
- Implementation: IMPLEMENTATION_PLAN_EVENT_TOGGLE.md
- Criteria: ACCEPTANCE_CRITERIA_BDD.md

---

**Document Status**: FINAL
**Last Reviewed**: 2025-12-29
