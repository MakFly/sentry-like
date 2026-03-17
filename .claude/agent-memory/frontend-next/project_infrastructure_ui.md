---
name: infrastructure_ui_components
description: Infrastructure monitoring UI components created in apps/web/src/components/infrastructure/
type: project
---

A set of infrastructure monitoring UI components lives at `apps/web/src/components/infrastructure/`. They are client components using Recharts and shadcn/ui, bound to the `"infrastructure"` i18n namespace via `useTranslations("infrastructure")`.

Components:
- `cpu-chart.tsx` — stacked AreaChart (user/system/idle, 0–100%)
- `memory-chart.tsx` — ComposedChart with Area (used) + dashed Line (swap), values in GB
- `network-chart.tsx` — LineChart for rx/tx bytes/sec, delta computed client-side from cumulative counters
- `disk-usage.tsx` — horizontal stacked BarChart (used/free per mountpoint, GB)
- `host-selector.tsx` — Select dropdown listing hosts by hostname + OS
- `date-range-selector.tsx` — ToggleGroup for 1h / 6h / 24h / 7d
- `infra-overview-cards.tsx` — 3 summary cards (avg CPU %, avg Memory %, host count) linking to `${baseUrl}/infrastructure`
- `index.ts` — barrel export for all of the above

**Why:** Infrastructure monitoring feature being built on the fix/security-audit-phase1 branch.

**How to apply:** When building infrastructure pages or adding new infra widgets, import from `@/components/infrastructure`. Translation keys needed in `en-US.json` and `fr.json` under the `"infrastructure"` namespace: `cpuUsage`, `cpuUser`, `cpuSystem`, `cpuIdle`, `memoryUsage`, `memoryUsed`, `memoryAvailable`, `swap`, `networkTraffic`, `networkReceived`, `networkSent`, `diskUsage`, `selectHost`, `overviewCpu`, `overviewMemory`, `overviewHosts`, `viewAll`.
