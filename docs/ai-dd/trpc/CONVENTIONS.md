# tRPC Conventions

## Structure des fichiers

```
dashboard/
├── src/
│   ├── server/                    # Code serveur uniquement
│   │   ├── api.ts                 # Client REST (fetch monitoring-server)
│   │   └── trpc/
│   │       ├── trpc.ts            # Config de base (ne pas modifier)
│   │       └── router.ts          # Définition des procedures
│   │
│   ├── lib/trpc/                  # Code client
│   │   ├── client.ts              # createTRPCReact
│   │   ├── provider.tsx           # TRPCProvider (React Query)
│   │   └── hooks.ts               # Hooks personnalisés
│   │
│   └── app/
│       └── api/trpc/[trpc]/
│           └── route.ts           # Route handler (ne pas modifier)
```

## Règles

### 1. Ajouter une nouvelle procedure

Dans `src/server/trpc/router.ts` :

```typescript
// 1. Ajouter la fonction API dans src/server/api.ts
export const api = {
  newFeature: {
    getData: async (): Promise<Data> => {
      return fetchAPI<Data>("/new-endpoint");
    },
  },
};

// 2. Ajouter le router dans src/server/trpc/router.ts
const newFeatureRouter = router({
  getData: publicProcedure.query(async () => {
    return api.newFeature.getData();
  }),
});

// 3. L'ajouter à appRouter
export const appRouter = router({
  groups: groupsRouter,
  stats: statsRouter,
  newFeature: newFeatureRouter,  // ← Ajouter ici
});
```

### 2. Ajouter un hook client

Dans `src/lib/trpc/hooks.ts` :

```typescript
export const useNewFeatureData = () => {
  return trpc.newFeature.getData.useQuery();
};
```

### 3. Input validation

Toujours utiliser Zod pour valider les inputs :

```typescript
import { z } from "zod";

const myProcedure = publicProcedure
  .input(z.object({
    id: z.string().uuid(),
    limit: z.number().min(1).max(100).default(10),
  }))
  .query(async ({ input }) => {
    // input est typé automatiquement
  });
```

### 4. Gestion des erreurs

```typescript
import { TRPCError } from "@trpc/server";

const getProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const item = await api.items.getById(input.id);

    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Item ${input.id} not found`,
      });
    }

    return item;
  });
```

## Anti-patterns à éviter

### ❌ Ne pas faire

```typescript
// Importer le router du monitoring-server
import { appRouter } from "../../../monitoring-server/src/router";

// Utiliser des hooks dans les Server Components
export default async function Page() {
  const { data } = useGroups();  // ❌ Hooks = Client seulement
}

// Appeler l'API REST directement dans les composants
export default function Component() {
  fetch("http://localhost:3333/groups");  // ❌ Utiliser tRPC
}
```

### ✅ À faire

```typescript
// Server Component → getServerCaller()
const caller = await getServerCaller();
const data = await caller.groups.getAll();

// Client Component → hooks
const { data } = useGroups();
```

## Variables d'environnement

```env
# .env.local
MONITORING_API_URL=http://localhost:3333
```
