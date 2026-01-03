# Acceptance Criteria - BDD Format

**Feature**: Event Ingestion Toggle per Project
**Scenario Testing**: 10 core scenarios
**Format**: Gherkin (Given/When/Then)

---

## Scenario 1: Toggle Appears in Settings UI

```gherkin
Feature: Event Ingestion Toggle UI
  Scenario: Display toggle in project settings
    Given I am an authenticated project owner
    And I navigate to /dashboard/[orgSlug]/[projectSlug]/settings
    When the settings page loads
    Then I should see an "Event Ingestion" card/section
    And the card shows a toggle switch
    And the toggle label reads "Accept incoming error events"
    And the description explains disabling blocks all incoming events
    And the toggle state reflects the backend value (enabled/disabled)
    And I should see a badge showing current state (Enabled/Disabled)
```

---

## Scenario 2: Toggle Persists State

```gherkin
Feature: Event Ingestion Toggle Persistence
  Scenario: Toggle state persists after save
    Given I am viewing project settings
    And the toggle is currently "Enabled"
    When I click the toggle to disable it
    Then the UI should immediately show "Disabled" state
    And a success toast should appear saying "Event ingestion setting updated"
    And the badge should change to "Disabled"
    And the warning message should appear ("Ingestion Disabled")

    When I refresh the page
    Then the toggle should still show "Disabled"
    And the setting should be persisted in the database
```

---

## Scenario 3: Disabled Project Rejects Events - HTTP 403

```gherkin
Feature: Event Rejection on Disabled Project
  Scenario: Disabled project returns HTTP 403
    Given a project with eventsEnabled = false
    And an API key for that project
    When a client POSTs an error event to /api/v1/events/{projectId}
    Then the server should return HTTP 403 Forbidden
    And the response body should include error message:
      """
      {
        "error": "Event ingestion disabled for this project",
        "projectId": "proj_xxx",
        "timestamp": "2025-12-29T10:30:00Z"
      }
      """
    And NO error event should be created in the database
    And NO error group should be created
```

---

## Scenario 4: Enabled Project Accepts Events

```gherkin
Feature: Event Acceptance on Enabled Project
  Scenario: Enabled project accepts events normally
    Given a project with eventsEnabled = true
    And an API key for that project
    And the project has 0 error events
    When a client POSTs a valid error event to /api/v1/events/{projectId}
    Then the server should return HTTP 200 OK
    And the response body should indicate success
    And exactly 1 new error event should be created in database
    And exactly 1 error group should be created
    And the error should appear in the dashboard
```

---

## Scenario 5: Re-enabling Resumes Event Acceptance

```gherkin
Feature: Event Ingestion Resume
  Scenario: Re-enabling project resumes event acceptance
    Given a project currently has eventsEnabled = false
    And events are being rejected with HTTP 403
    When a project owner toggles ingestion back to enabled
    Then the UI should show "Enabled" state
    And the badge should change to "Enabled"
    And the warning message should disappear

    When a client POSTs a new error event
    Then the server should return HTTP 200 OK
    And the new event should be created in the database
    And it should be visible in the dashboard immediately
```

---

## Scenario 6: Existing Events Remain Visible When Disabled

```gherkin
Feature: Historical Data Preservation
  Scenario: Disabling ingestion doesn't hide past events
    Given a project with 50 existing error events
    When I toggle event ingestion to disabled
    Then all 50 existing errors should still be visible in the dashboard
    And I can still view error details, timelines, and statistics
    And I can still assign errors, change status, or add comments
    And the event count in UI should still show 50

    When new events arrive while disabled
    Then those new events should be rejected (HTTP 403)
    And the dashboard error count should still be 50
```

---

## Scenario 7: Multi-Tenant Isolation

```gherkin
Feature: Multi-Tenant Event Ingestion Control
  Scenario: One project disabled doesn't affect others
    Given Organization A has Project X with eventsEnabled = false
    And Organization A has Project Y with eventsEnabled = true
    And Organization B has Project Z with eventsEnabled = true
    When I POST an event to Project X's endpoint
    Then I get HTTP 403 Forbidden
    And no event is created for Project X

    When I POST an event to Project Y's endpoint
    Then I get HTTP 200 OK
    And the event is created for Project Y

    When I POST an event to Project Z's endpoint
    Then I get HTTP 200 OK
    And the event is created for Project Z

    And Project X's disabled state should not affect Y or Z in any way
```

---

## Scenario 8: Database Default Value

```gherkin
Feature: Backwards Compatibility
  Scenario: New projects default to enabled
    Given I create a new project
    When the project is created
    Then a project_settings row should be created
    And the eventsEnabled field should default to true
    And the project should immediately accept events
    And no action required from user

    Scenario: Old projects migrate to enabled
      Given I run the database migration
      And there are 100 existing projects
      When the migration adds the eventsEnabled column
      Then all 100 projects should have eventsEnabled = true by default
      And no events should be affected
      And the old projects should continue working without interruption
```

---

## Scenario 9: Authorization Check

```gherkin
Feature: Project Settings Authorization
  Scenario: Only project owner can toggle ingestion
    Given User A owns Project X
    And User B is a member (not owner) of Project X
    When User B tries to PATCH /api/v1/project-settings/{projectId}
    Then the server should return HTTP 403 Forbidden
    And the message should be "Unauthorized"
    And no settings should be changed

    When User A (owner) tries to PATCH the same endpoint
    Then the server should return HTTP 200 OK
    And the settings should be updated
```

---

## Scenario 10: Audit Logging

```gherkin
Feature: Audit Trail
  Scenario: Toggle changes are logged
    Given a project owner navigates to settings
    When they toggle eventsEnabled from true to false
    Then a log entry should be created with:
      - Action: "project_settings_updated"
      - ProjectId: the project ID
      - Field: "eventsEnabled"
      - OldValue: true
      - NewValue: false
      - UserId: the owner's ID
      - Timestamp: current time

    And the log should be queryable/viewable (for future audit UI)
```

---

## Testing Scenario: Mass Event Test with kev.aubree@gmail.com

```gherkin
Feature: Real-World Testing Scenario
  Scenario: Developer tests mass event ingestion
    Given User kev.aubree@gmail.com is logged in
    And they have a project called "TestProject"
    And they created a script that sends 1000 events in parallel

    When they toggle Event Ingestion to DISABLED
    Then their mass event script receives 403 Forbidden responses
    And the project error count remains at previous level
    And CPU/Memory don't spike from processing rejected events

    When they toggle back to ENABLED
    Then the same script now receives 200 OK responses
    And all events are created in the database
    And the project error count increases by 1000
    And they can filter/search the new events in the dashboard
```

---

## Non-Functional Acceptance Criteria

```gherkin
Feature: Performance & Reliability
  Scenario: Toggle check doesn't impact latency
    Given 10,000 events/minute incoming to monitoring server
    When the eventsEnabled check is performed
    Then it should take < 5ms per request (cached settings)
    And p99 latency should remain < 100ms

  Scenario: Toggle UI responds quickly
    Given I'm on the settings page
    When I click the toggle
    Then the UI feedback should be instant (< 100ms)
    And the mutation request should complete within 2 seconds
    And if it fails, I should see an error toast

  Scenario: Handle network errors gracefully
    Given I click the toggle
    When the API request fails due to network error
    Then the UI should revert the toggle to previous state
    And an error toast should appear
    And no misleading state should be shown
```

---

## Error Handling Scenarios

```gherkin
Feature: Error Scenarios
  Scenario: Event sent to non-existent project
    Given an API key for a non-existent project
    When an event is POSTed
    Then the server should return HTTP 401 Unauthorized
    And NOT HTTP 403 (403 only for disabled projects)

  Scenario: Event sent with invalid API key
    Given an invalid/expired API key
    When an event is POSTed
    Then the server should return HTTP 401 Unauthorized

  Scenario: Settings page fails to load
    Given the API fails to return project settings
    When I navigate to settings
    Then a loading skeleton should appear
    And if timeout occurs, error message should display
    And user can retry
```

---

## User Experience Scenarios

```gherkin
Feature: User-Friendly Experience
  Scenario: Clear visual indication of disabled state
    Given a project has ingestion disabled
    When I navigate to settings
    Then I should see:
      - Badge showing "Disabled" in red/amber color
      - Toggle switch in OFF position
      - Warning box explaining what's disabled
      - Explanation of what happens when disabled
      - Clear instructions on how to re-enable

  Scenario: No confusion between project states
    Given I have two projects (one enabled, one disabled)
    When I switch between project settings
    Then the toggle state should update correctly
    And the badge should update
    And the warning message appears/disappears accordingly
    And I can clearly see which is which
```

---

## API Response Format Compliance

```gherkin
Feature: API Contracts
  Scenario: 403 Response Format
    Given a disabled project endpoint
    When an event is rejected
    Then the response should match:
      Status: 403 Forbidden
      Headers: { "Content-Type": "application/json" }
      Body:
        {
          "error": "Event ingestion disabled for this project",
          "projectId": "<string>",
          "timestamp": "<ISO8601>"
        }

  Scenario: Settings GET Response Format
    Given I fetch project settings
    When the API responds successfully
    Then the response should include:
      {
        "id": "...",
        "projectId": "...",
        "timezone": "...",
        "retentionDays": 30,
        "autoResolve": true,
        "autoResolveDays": 14,
        "sampleRate": "1.0",
        "eventsEnabled": true,
        "updatedAt": "..."
      }

  Scenario: Settings PATCH Response Format
    Given I update project settings
    When the API responds successfully
    Then the response should match the GET response format
    And it should confirm the updated fields
```

---

## Summary Table

| Scenario | Type | Priority | Status |
|----------|------|----------|--------|
| Toggle appears in UI | Functional | P0 | Ready |
| Toggle persists state | Functional | P0 | Ready |
| 403 on disabled project | Functional | P0 | Ready |
| 200 on enabled project | Functional | P0 | Ready |
| Re-enable resumes events | Functional | P1 | Ready |
| Existing events visible | Functional | P1 | Ready |
| Multi-tenant isolation | Functional | P0 | Ready |
| Default value on new projects | Functional | P0 | Ready |
| Authorization checks | Security | P0 | Ready |
| Audit logging | Compliance | P1 | Ready |
| Performance impact | Non-Functional | P1 | Ready |
| Error handling | Quality | P1 | Ready |
| User experience | UX | P2 | Ready |
| API response format | Contract | P0 | Ready |

---

## Test Coverage Goals

- **Unit Tests**: 85%+ coverage (backend validation logic)
- **Integration Tests**: 100% of API endpoints
- **E2E Tests**: All 10 scenarios + 5 error cases
- **Manual Testing**: Full scenario with kev.aubree@gmail.com

**Total Test Cases**: ~25 automated + 3-4 manual
**Estimated Test Time**: 4-6 hours development + 1-2 hours manual QA

---

## Sign-Off Criteria

- [ ] All 10 scenarios pass
- [ ] Performance benchmarks met (< 5ms check, < 100ms UI response)
- [ ] Multi-tenant isolation verified
- [ ] Backwards compatibility confirmed
- [ ] Authorization checks pass security review
- [ ] Error messages clear and helpful
- [ ] Documentation complete
- [ ] Product Owner approves feature
- [ ] Ready for production rollout
