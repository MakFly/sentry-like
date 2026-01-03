# tRPC Architecture - Dashboard

## Overview

Le dashboard utilise tRPC avec le pattern **Next.js 16 App Router** pour une communication type-safe entre le client et le serveur.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Dashboard                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │ Server Component│───▶│ getServerCaller() (direct call) ││
│  └─────────────────┘    └─────────────────────────────────┘│
│                                      │                      │
│                                      ▼                      │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │ Client Component│───▶│ trpc.xxx.useQuery() (via HTTP)  ││
│  └─────────────────┘    └─────────────────────────────────┘│
│           │                          │                      │
│           │                          ▼                      │
│           │             ┌─────────────────────────────────┐│
│           └────────────▶│ /api/trpc/[trpc] (route handler)││
│                         └─────────────────────────────────┘│
│                                      │                      │
└──────────────────────────────────────│──────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │ src/server/trpc/router  │
                          │ (appRouter)             │
                          └─────────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │ src/server/api.ts       │
                          │ (REST API client)       │
                          └─────────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │ Monitoring Server       │
                          │ http://localhost:3333   │
                          └─────────────────────────┘
```

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/server/trpc/trpc.ts` | Configuration de base tRPC |
| `src/server/trpc/router.ts` | Définition des procedures |
| `src/server/api.ts` | Client REST pour monitoring-server |
| `src/app/api/trpc/[trpc]/route.ts` | Route handler Next.js |
| `src/lib/trpc/client.ts` | Client React tRPC |
| `src/lib/trpc/provider.tsx` | Provider React Query |
| `src/lib/trpc/hooks.ts` | Hooks personnalisés |

## Patterns utilisés

### Server Components (RSC)

```typescript
// Dans un Server Component (async function)
import { getServerCaller } from "@/server/trpc/router";

export default async function Page() {
  const caller = await getServerCaller();
  const data = await caller.groups.getAll();
  return <div>{/* ... */}</div>;
}
```

### Client Components

```typescript
"use client";
import { useGroups } from "@/lib/trpc/hooks";

export default function Component() {
  const { data, isLoading, error } = useGroups();
  // ...
}
```

## Pourquoi ce pattern ?

1. **Type-safety** : Types partagés entre client et serveur
2. **Performance** : Server Components utilisent appel direct (pas de HTTP)
3. **DX** : Hooks React Query avec cache automatique
4. **Séparation** : Le dashboard ne connaît pas l'implémentation du monitoring-server
