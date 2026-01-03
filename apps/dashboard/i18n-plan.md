# Plan d integration i18n (next-intl)

## Contexte
- Next.js 16, App Router
- Proxy via `src/proxy.ts` (pas de `middleware.ts`)
- Locales: `en-US` (defaut) et `fr`
- Detection automatique (Accept-Language), pas de prefixe d URL (pas de `/fr/...`)

## Decisions
- Utiliser `next-intl` + `createNextIntlPlugin` dans `next.config.ts`.
- Routing centralise dans `src/i18n/routing.ts` avec:
  - `locales: ['en-US', 'fr']`
  - `defaultLocale: 'en-US'`
  - `localePrefix: 'never'`
  - `localeDetection: true`
- Messages locaux dans `src/messages/en-US.json` et `src/messages/fr.json`.
- Garder `app/[locale]` en interne pour distribuer la locale, meme si l URL n affiche pas de prefixe.

## Plan technique
1. **Config et dependances**
   - Ajouter `next-intl` (si pas deja present).
   - Envelopper `next.config.ts` avec `createNextIntlPlugin()`.
2. **Fichiers i18n**
   - `src/i18n/routing.ts`: `defineRouting(...)`.
   - `src/i18n/request.ts`: `getRequestConfig({requestLocale})`, validation via `hasLocale`, chargement des messages par locale.
   - `src/i18n/navigation.ts`: wrappers `Link/redirect/useRouter/getPathname` via `createNavigation(routing)`.
   - Creer les fichiers de messages `src/messages/en-US.json` et `src/messages/fr.json`.
3. **Routing App Router**
   - Deplacer les routes UI sous `src/app/[locale]/...`:
     - `(auth)`, `(marketing)`, `(onboarding)`, `dashboard`, `(dev)`
   - Creer `src/app/[locale]/layout.tsx`:
     - `setRequestLocale(locale)`
     - `getMessages()` + `NextIntlClientProvider`
     - Garder `TRPCProvider`, `NuqsAdapter`, `Toaster`
     - Import CSS via `../globals.css`
   - Laisser `src/app/api` a la racine.
4. **Proxy i18n + auth**
   - Integrer `createMiddleware(routing)` dans `src/proxy.ts` avant la logique auth.
   - Si le middleware i18n renvoie un redirect/rewrite, retourner tot.
   - Quand on renvoie une reponse auth, propager headers/cookies du middleware i18n.
   - Ajuster `config.matcher` pour exclure `api`, `_next`, `_vercel` et les fichiers avec `.` (voir docs next-intl).
5. **Deploiement des traductions**
   - Remplacer progressivement les textes par `useTranslations` / `getTranslations`.
   - Mettre a jour les metadata (optionnel) pour tenir compte de `locale`.

## Validation
- `/` doit servir `en-US` par defaut.
- Navigateur en `fr` doit servir `fr` sans prefixe d URL.
- Auth et onboarding OK (redirections, cookies, session).
- Dashboard et routes marketing OK.
- Pas d impact sur `/api/...` ni sur `_next/...`.

## Risques et points d attention
- Le deplacement vers `app/[locale]` peut impacter les imports relatifs et les chemins internes.
- Bien conserver les headers/cookies du middleware i18n dans `src/proxy.ts`.
- Verifier les regex de `matcher` si des routes attendent des points dans l URL.
