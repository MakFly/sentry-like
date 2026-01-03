# API Contracts - Event Ingestion Toggle

**Version**: 1.0
**Status**: Specification Ready
**Last Updated**: 2025-12-29

---

## Overview

This document defines the API contracts for the Event Ingestion Toggle feature. All endpoints must comply with these specifications.

---

## 1. Get Project Settings

### Endpoint

```
GET /api/v1/project-settings/{projectId}
```

### Authentication

- Required: Yes (Bearer token or API key)
- Scope: Project owner or organization member

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | The project ID (e.g., `proj_abc123`) |

### Query Parameters

None

### Request Headers

```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Request Body

None

### Success Response (200 OK)

```json
{
  "id": "settings_xyz789",
  "projectId": "proj_abc123",
  "timezone": "Europe/Paris",
  "retentionDays": 30,
  "autoResolve": true,
  "autoResolveDays": 14,
  "sampleRate": "1.0",
  "eventsEnabled": true,
  "updatedAt": "2025-12-29T10:30:00Z"
}
```

**Status Code**: 200
**Content-Type**: `application/json`

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required. Please log in."
}
```

#### 403 Forbidden (No Access)

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this project's settings"
}
```

#### 404 Not Found

```json
{
  "error": "NotFound",
  "message": "Project not found"
}
```

### Example Request

```bash
curl -X GET "http://localhost:3333/api/v1/project-settings/proj_abc123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "id": "settings_xyz789",
  "projectId": "proj_abc123",
  "timezone": "Europe/Paris",
  "retentionDays": 30,
  "autoResolve": true,
  "autoResolveDays": 14,
  "sampleRate": "1.0",
  "eventsEnabled": true,
  "updatedAt": "2025-12-29T10:30:00Z"
}
```

---

## 2. Update Project Settings (Partial Update)

### Endpoint

```
PATCH /api/v1/project-settings/{projectId}
```

### Authentication

- Required: Yes (Bearer token)
- Scope: Project owner only (not members)

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | The project ID |

### Query Parameters

None

### Request Headers

```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Request Body

```json
{
  "timezone": "Europe/London",
  "retentionDays": 60,
  "autoResolve": false,
  "autoResolveDays": 7,
  "sampleRate": "0.8",
  "eventsEnabled": false
}
```

**Note**: All fields are optional. Only include fields you want to update.

### Field Specifications

| Field | Type | Optional | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `timezone` | string | Yes | Valid IANA timezone | Timezone for this project |
| `retentionDays` | integer | Yes | 1-90 | Days to retain error data |
| `autoResolve` | boolean | Yes | - | Auto-resolve old errors |
| `autoResolveDays` | integer | Yes | 1-365 | Days before auto-resolve |
| `sampleRate` | string | Yes | "0.0" - "1.0" | Sample rate (0.5 = 50%) |
| `eventsEnabled` | boolean | Yes | - | Accept incoming events (NEW) |

### Success Response (200 OK)

```json
{
  "id": "settings_xyz789",
  "projectId": "proj_abc123",
  "timezone": "Europe/London",
  "retentionDays": 60,
  "autoResolve": false,
  "autoResolveDays": 7,
  "sampleRate": "0.8",
  "eventsEnabled": false,
  "updatedAt": "2025-12-29T11:45:00Z"
}
```

**Status Code**: 200
**Content-Type**: `application/json`

### Error Responses

#### 400 Bad Request

```json
{
  "error": "BadRequest",
  "message": "Invalid value for field 'retentionDays': must be between 1 and 90",
  "field": "retentionDays"
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Only project owners can modify settings"
}
```

#### 404 Not Found

```json
{
  "error": "NotFound",
  "message": "Project settings not found"
}
```

### Example Request

```bash
curl -X PATCH "http://localhost:3333/api/v1/project-settings/proj_abc123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "eventsEnabled": false
  }'
```

### Example Response

```json
{
  "id": "settings_xyz789",
  "projectId": "proj_abc123",
  "timezone": "Europe/Paris",
  "retentionDays": 30,
  "autoResolve": true,
  "autoResolveDays": 14,
  "sampleRate": "1.0",
  "eventsEnabled": false,
  "updatedAt": "2025-12-29T11:45:00Z"
}
```

---

## 3. Event Ingestion (POST Event)

### Endpoint

```
POST /api/v1/events
```

### Authentication

- Required: Yes (API key or Bearer token)
- Scope: Public (any valid API key)

### Path Parameters

None

### Query Parameters

None

### Request Headers

```http
Authorization: Bearer <api_key> OR X-API-Key: <api_key>
Content-Type: application/json
```

### Request Body

```json
{
  "message": "TypeError: Cannot read property 'foo' of undefined",
  "stack": "Error: Cannot read property...\n  at ...",
  "url": "https://example.com/page",
  "env": "production",
  "statusCode": 500,
  "level": "error",
  "release": "1.2.3",
  "breadcrumbs": [
    {
      "timestamp": "2025-12-29T10:30:00Z",
      "category": "user-action",
      "type": "click",
      "message": "Clicked button"
    }
  ],
  "sessionId": "session_abc123"
}
```

### Success Response (200 OK) - Events Enabled

```json
{
  "success": true,
  "eventId": "event_abc123",
  "groupId": "group_xyz789",
  "message": "Event recorded successfully"
}
```

**Status Code**: 200
**Content-Type**: `application/json`

### Blocked Response (403 Forbidden) - Events Disabled

**⚠️ NEW BEHAVIOR**: When `eventsEnabled = false`

```json
{
  "error": "Event ingestion disabled for this project",
  "projectId": "proj_abc123",
  "timestamp": "2025-12-29T10:30:00Z"
}
```

**Status Code**: 403 Forbidden
**Content-Type**: `application/json`

**Note**:
- No event is created
- No error group is created
- Request is logged at WARN level
- Response is sent immediately (no processing)

### Error Responses

#### 401 Unauthorized (Invalid API Key)

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

#### 400 Bad Request (Invalid Event)

```json
{
  "error": "BadRequest",
  "message": "Event validation failed",
  "details": {
    "message": "required field",
    "stack": "required field"
  }
}
```

#### 429 Too Many Requests (Rate Limited)

```json
{
  "error": "RateLimited",
  "message": "Too many requests. Try again later.",
  "retryAfter": 60
}
```

#### 500 Internal Server Error

```json
{
  "error": "InternalServerError",
  "message": "Failed to process event",
  "requestId": "req_abc123"
}
```

### Example Request (Success Case)

```bash
curl -X POST "http://localhost:3333/api/v1/events" \
  -H "Authorization: Bearer proj_abc123:key_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Database connection error",
    "stack": "Error: ECONNREFUSED...",
    "url": "https://example.com",
    "env": "production",
    "statusCode": 500,
    "level": "error"
  }'
```

### Example Response (Success)

```json
{
  "success": true,
  "eventId": "event_abc123",
  "groupId": "group_xyz789",
  "message": "Event recorded successfully"
}
```

### Example Request (When Events Disabled)

```bash
curl -X POST "http://localhost:3333/api/v1/events" \
  -H "Authorization: Bearer proj_disabled:key_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This will be rejected",
    "stack": "Error: ...",
    "env": "production"
  }'
```

### Example Response (Events Disabled)

```json
{
  "error": "Event ingestion disabled for this project",
  "projectId": "proj_disabled",
  "timestamp": "2025-12-29T10:30:00Z"
}
```

**HTTP Status**: 403 Forbidden

---

## 4. Response Schemas

### ProjectSettings Schema

```typescript
interface ProjectSettings {
  id: string;                    // settings_xyz789
  projectId: string;             // proj_abc123
  timezone: string;              // Europe/Paris
  retentionDays: number;         // 30
  autoResolve: boolean;          // true
  autoResolveDays: number;       // 14
  sampleRate: string;            // "1.0"
  eventsEnabled: boolean;        // NEW: true or false
  updatedAt: string;             // ISO8601 timestamp
}
```

### EventIngestionError Schema (403)

```typescript
interface EventIngestionError {
  error: string;                 // "Event ingestion disabled for this project"
  projectId: string;             // proj_abc123
  timestamp: string;             // ISO8601 timestamp
}
```

### ErrorResponse Schema

```typescript
interface ErrorResponse {
  error: string;                 // Error type (e.g., "Unauthorized")
  message: string;               // Human-readable message
  details?: Record<string, any>; // Additional error details
  requestId?: string;            // For debugging
  field?: string;                // For validation errors
  retryAfter?: number;           // Seconds to wait (for 429)
}
```

---

## 5. Status Code Summary

| Status | Scenario | Response |
|--------|----------|----------|
| **200** | Event accepted | `{ "success": true, ... }` |
| **200** | Settings retrieved | `{ "id": "...", "eventsEnabled": true, ... }` |
| **200** | Settings updated | `{ "id": "...", "eventsEnabled": false, ... }` |
| **400** | Bad request data | `{ "error": "BadRequest", ... }` |
| **401** | Missing/invalid auth | `{ "error": "Unauthorized", ... }` |
| **403** | No permission | `{ "error": "Forbidden", ... }` |
| **403** | Events disabled ⭐ | `{ "error": "Event ingestion disabled...", ... }` |
| **404** | Resource not found | `{ "error": "NotFound", ... }` |
| **429** | Rate limited | `{ "error": "RateLimited", ... }` |
| **500** | Server error | `{ "error": "InternalServerError", ... }` |

---

## 6. Headers

### Request Headers (Always Include)

```http
Content-Type: application/json
Authorization: Bearer <token> OR Authorization: Bearer <api_key>
```

### Response Headers (Always Included)

```http
Content-Type: application/json
X-Request-ID: req_abc123
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1735656000
```

---

## 7. Backward Compatibility

### Breaking Changes: NONE

The `eventsEnabled` field:
- Defaults to `true` for new projects
- Defaults to `true` for old projects (migration)
- Is optional in PATCH requests
- When not provided, current value is preserved

### API Versioning

- Current version: **v1**
- Version path: `/api/v1/*`
- Old endpoints remain unchanged

### SDK Compatibility

SDKs must:
1. Handle 403 responses gracefully (don't crash)
2. Log 403 rejections for debugging
3. Retry logic: DO NOT retry on 403 (it's intentional)
4. Document in release notes that 403 is possible

---

## 8. Rate Limiting

### Limits

```
GET /api/v1/project-settings/*   → 1000 req/minute per user
PATCH /api/v1/project-settings/* → 100 req/minute per user
POST /api/v1/events              → 10,000 req/minute per project
```

### Headers

```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9999
X-RateLimit-Reset: 1735656000
```

### 429 Response

```json
{
  "error": "RateLimited",
  "message": "Too many requests",
  "retryAfter": 60
}
```

---

## 9. Logging & Monitoring

### Log Events

**Event Rejected (403)**:
```
[WARN] Event rejected: projectId=proj_abc123, reason=ingestion_disabled, timestamp=2025-12-29T10:30:00Z
```

**Settings Updated**:
```
[INFO] Project settings updated: projectId=proj_abc123, userId=user_xyz, fields=[eventsEnabled], timestamp=2025-12-29T10:30:00Z
```

**Settings Fetched**:
```
[DEBUG] Project settings fetched: projectId=proj_abc123, userId=user_xyz, timestamp=2025-12-29T10:30:00Z
```

---

## 10. Testing the API

### Test 1: Check Current Settings

```bash
curl -X GET "http://localhost:3333/api/v1/project-settings/proj_abc123" \
  -H "Authorization: Bearer <token>"
```

Expected: `{ ..., "eventsEnabled": true }`

### Test 2: Disable Events

```bash
curl -X PATCH "http://localhost:3333/api/v1/project-settings/proj_abc123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "eventsEnabled": false }'
```

Expected: `{ ..., "eventsEnabled": false }`

### Test 3: Send Event (Should Fail)

```bash
curl -X POST "http://localhost:3333/api/v1/events" \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{ "message": "Test", "stack": "...", "env": "test" }'
```

Expected: `HTTP 403 Forbidden` with error message

### Test 4: Re-enable Events

```bash
curl -X PATCH "http://localhost:3333/api/v1/project-settings/proj_abc123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "eventsEnabled": true }'
```

Expected: `{ ..., "eventsEnabled": true }`

### Test 5: Send Event (Should Succeed)

```bash
curl -X POST "http://localhost:3333/api/v1/events" \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{ "message": "Test", "stack": "...", "env": "test" }'
```

Expected: `HTTP 200 OK` with event details

---

## 11. Postman Collection

```json
{
  "info": {
    "name": "Event Ingestion Toggle API",
    "description": "API collection for testing event ingestion toggle feature"
  },
  "item": [
    {
      "name": "Get Project Settings",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/project-settings/{{projectId}}",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{sessionToken}}"
          }
        ]
      }
    },
    {
      "name": "Update Settings (Disable Events)",
      "request": {
        "method": "PATCH",
        "url": "{{baseUrl}}/api/v1/project-settings/{{projectId}}",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{sessionToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"eventsEnabled\": false}"
        }
      }
    },
    {
      "name": "Post Event (Should Fail if Disabled)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/events",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"message\": \"Test error\", \"stack\": \"...\", \"env\": \"test\"}"
        }
      }
    }
  ]
}
```

---

## 12. Common Errors & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `{"error": "Unauthorized"}` | Invalid/missing API key | Verify API key is correct |
| `{"error": "Forbidden"}` | Not project owner | Use owner credentials |
| `{"error": "Event ingestion disabled..."}` | Events are disabled | Toggle back to enabled in settings |
| `{"error": "BadRequest"}` | Invalid field value | Check field constraints (e.g., retentionDays: 1-90) |
| `Connection refused` | Server not running | Start monitoring server on port 3333 |

---

## 13. Migration Notes

### For SDKs

SDKs must be updated to handle 403:

```typescript
// Before: Only expect 2xx or errors
if (response.status === 200) {
  // Success
} else {
  // Error
}

// After: Handle 403 as intentional blocking
if (response.status === 403) {
  const body = await response.json();
  if (body.error === "Event ingestion disabled for this project") {
    // This is intentional, don't retry
    logger.warn("Event ingestion disabled for this project");
    return;
  }
}
```

### For Client Apps

No changes required. The monitoring server handles validation. Clients will automatically get 403 and can handle it gracefully.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-29 | Initial specification with eventsEnabled field |

---

## References

- User Story: `USER_STORY_EVENT_INGESTION_TOGGLE.md`
- Implementation Plan: `IMPLEMENTATION_PLAN_EVENT_TOGGLE.md`
- Database Schema: `/apps/monitoring-server/src/db/schema.ts`
- Monitoring Server Code: `/apps/monitoring-server/src/api/v1/*`

---

**Document Status**: FINAL
**Ready for Implementation**: YES
**Last Review Date**: 2025-12-29
