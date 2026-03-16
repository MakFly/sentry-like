---
name: i18n setup and message files
description: next-intl configuration, message file locations, and existing namespaces in the web app
type: project
---

next-intl is configured in the web app. Message files are at:
- `apps/web/src/messages/en-US.json`
- `apps/web/src/messages/fr.json`

**Why:** The app supports English (en-US) and French (fr) locales. Routes are under `app/[locale]/`.

**How to apply:** When adding translated strings, always read both JSON files first before writing — other agents may have added namespaces concurrently. Append new namespaces without removing existing content.

## Existing namespaces (as of 2026-03-16)

Both files contain:
- `common` — shared UI labels (cancel, save, delete, etc.)
- `onboarding` — onboarding wizard steps, invite flow
- `auth` — login and signup pages (badge, title, form labels, SSO errors, panel content, feature list items)
- `navigation`, `organization`, `project`, `platform`, `upgrade`, `noProject`, `placeholderDashboard` — app dashboard UI
- `performance` — performance pages (overview, transactions, web vitals, queries, apdex, transaction detail, waterfall)
- `replays` — session replays (title, subtitle, session player, filters)
- `help` — help center (quick start, documentation, common tasks, more help)
- `logs` — live logs terminal (title, live/paused states, filters)
- `settings` — settings tabs (general, alerts, apiKeys, billing, data, organizations, dialogs)
- `dashboard`, `stats`, `issues`, `issueDetail` — other dashboard namespaces
- `marketing` — landing page and marketing layout (nav, footer, hero, features, howItWorks, pricing, testimonials, cta)

## performance namespace structure

```json
"performance": {
  "overview": "...",
  "dateRange": { "last24h": "...", "last7d": "...", "last30d": "...", "last90d": "...", "last6m": "...", "lastYear": "..." },
  "serverResponseTime": "... ({label})",
  "throughputLabel": "...", "throughputUnit": "...", "errorRate": "...", "aboveThreshold": "...",
  "subPages": { "transactions": { "title": "...", "description": "..." }, "webVitals": {...}, "databaseQueries": {...} },
  "transactions": { "title": "...", "noTransactions": "...", "tabAll": "...", "tabSlowest": "...", "pageOf": "... {page} ... {total}", "totalCount": "{count} ...", "grouped": "...", "individual": "...", "backToTransactions": "...", "notFound": "...", "columns": {...} },
  "slowestTransactions": { "title": "..." },
  "webVitals": { "title": "...", "noData": "...", "noDataHint": "...", "status": {"good","needsImprovement","poor"}, "descriptions": {"LCP","FID","CLS","TTFB","INP"} },
  "apdex": { "title": "...", "noData": "...", "excellent/good/fair/poor/unacceptable": "...", "satisfied": "...({threshold}ms)", "tolerating/frustrated/total": "..." },
  "queries": { "title": "...", "insights": { "title", "duplicates", "slowest", "columns", "severity" }, "endpointImpact": { "title", "columns" } },
  "transactionDetail": { "duration/operation/environment/spans/traceId/breakdown": "...", "queryStats": {...}, "n1Detected": {...}, "waterfall": {...} }
}
```

## replays namespace structure

```json
"replays": {
  "title": "...", "subtitle": "...", "sessions": "...",
  "failedToLoad": "...", "noMatchingSessions": "...", "noSessionsYet": "...",
  "sessionNotFound": "...", "sessionNotFoundDesc": "...", "backToReplays": "...",
  "noEventsRecorded": "...", "noEventsDesc": "...",
  "filters": { "searchByUrl", "allBrowsers", "allOS", "allTime", "timeRange", "allSeverity", "clear", "last24h/7d/30d/90d", "severityFatal/Error/Warning/Info/Debug" }
}
```

## help namespace structure

```json
"help": {
  "title": "...", "subtitle": "...",
  "quickStart": { "title", "subtitle", "dashboardOverview": {"title","description"}, "managingIssues": {...}, "sessionReplays": {...}, "statistics": {...} },
  "documentation": { "title", "gettingStarted": {...}, "sdkIntegration": {...}, "apiReference": {...}, "configuration": {...} },
  "commonTasks": { "title", "managingProjects": {...}, "managingTeam": {...}, "settingUpAlerts": {...} },
  "moreHelp": { "title", "subtitle", "openIssue", "fullDocumentation" }
}
```

## marketing namespace structure

Arrays use indexed string keys (`"0"`, `"1"`, ...) under a parent object:
```json
"features": { "items": { "0": { "title": "...", "description": "..." }, ... } }
"pricing": { "tiers": { "0": { "name": "...", "features": { "0": "...", ... } }, ... } }
"testimonials": { "items": { "0": { "quote": "...", "author": "...", ... }, ... } }
"howItWorks": { "steps": { "0": { "title": "...", "description": "..." }, ... } }
```

Usage in components (iterate with template literal):
```tsx
const features = Array.from({ length: 6 }, (_, i) => t(`features.items.${i}.title`));
```

## Usage pattern

```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('performance');
// Nested namespace shortcut:
const t = useTranslations('performance.apdex');
// Nested keys: t('title'), t('satisfied', { threshold: 500 })
```

Dynamic string format in JSON: `"ssoFailed": "{provider} login failed"`, `"pageOf": "Page {page} of {total}"`
