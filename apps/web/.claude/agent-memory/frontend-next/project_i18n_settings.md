---
name: i18n settings namespace
description: The settings namespace has been added to both message files and all settings components are translated
type: project
---

The `settings` namespace was added to `apps/web/src/messages/en-US.json` and `apps/web/src/messages/fr.json` as part of Phase 8 i18n.

**Why:** Full i18n coverage for the settings section of the dashboard.

**How to apply:** When working on settings components, always use `useTranslations('settings')` or sub-namespaces like `useTranslations('settings.general')`, `useTranslations('settings.alerts')`, etc.

## Namespace structure

- `settings.tabs` — tab labels (general, alerts, apiKeys, billing, data, organizations)
- `settings.general` — general section (~55 keys: project, profile, DSN, security, sessions, danger zone)
- `settings.alerts` — alerts section (email, slack, threshold)
- `settings.apiKeys` — API keys section
- `settings.billing` — billing/plan section
- `settings.data` — data management section (ingestion, retention, auto-resolve)
- `settings.organizations` — org management section
- `settings.dialogs.createOrg` — create organization dialog
- `settings.dialogs.inviteMember` — invite member dialog

## Files translated

All 10 files in `app/[locale]/dashboard/[orgSlug]/[projectSlug]/settings/`:
- `settings-content.tsx` — tabs
- `sections/general-section.tsx`
- `sections/alerts-section.tsx`
- `sections/api-keys-section.tsx`
- `sections/billing-section.tsx`
- `sections/data-section.tsx`
- `sections/organizations-section.tsx`
- `dialogs/create-organization-dialog.tsx`
- `dialogs/invite-member-dialog.tsx`
- `page.tsx` — no strings to translate

## JSON insertion approach

Other agents modify the JSON files concurrently. Use `python3` with `json.load/dump` to safely add namespaces — avoid Edit tool on JSON files when parallel agents are active.
