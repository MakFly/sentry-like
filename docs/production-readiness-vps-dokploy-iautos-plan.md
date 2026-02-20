# Plan Ready-to-Prod ErrorWatch + Validation locale avec iAutos (VPS & Dokploy)

## Résumé
Objectif validé:
1. Rendre `sentry-like` déployable en prod sur **VPS** et **Dokploy**.
2. Ajouter une **intégration Symfony native** dans `/home/kev/Documents/lab/sites/saas/iautos/api`.
3. Valider un flux end-to-end: exception Symfony `->` ingestion ErrorWatch `->` worker `->` dashboard.

État actuel bloquant constaté:
- `lint` échoue fortement (dashboard).
- `build` échoue (`apps/worker`).
- CI/CD absente.
- Compose prod incomplet (pas de services applicatifs).
- Packaging Docker dashboard/worker à fiabiliser.

## Changements API/interfaces/types publics
1. Variables d’environnement standardisées (obligatoires en prod):
- `DATABASE_URL`, `REDIS_URL`, `DASHBOARD_URL`, `BETTER_AUTH_URL`, `API_KEY_HASH_SECRET`, `ADMIN_API_KEY`.
2. Ajout d’un contrat d’intégration Symfony iAutos:
- `ERRORWATCH_ENABLED`
- `ERRORWATCH_API_URL`
- `ERRORWATCH_API_KEY`
- `ERRORWATCH_ENV`
- `ERRORWATCH_RELEASE` (optionnel)
3. Endpoint de santé/monitoring conservé:
- `/health/live`, `/health/ready`
- `/metrics` restreint (token/IP/réseau interne).

## Plan d’implémentation (ordre exact, décision complète)

1. **Structurer le déploiement prod VPS/Dokploy**
- Créer `docker-compose.prod.yml` avec `dashboard`, `monitoring-server`, `worker`, `postgres`, `redis`.
- Ajouter profiles:
- `dokploy`: sans reverse proxy local.
- `vps`: avec Caddy (TLS + reverse proxy).
- Définir healthchecks + dépendances `service_healthy`.
- Garder volumes persistants DB/Redis/sourcemaps.

2. **Fiabiliser le packaging Docker**
- Dashboard:
- Activer `output: "standalone"` dans `apps/dashboard/next.config.ts`.
- Aligner Dockerfile avec les vrais fichiers config présents.
- Worker:
- Corriger `apps/worker/src/index.ts` (imports/variables inutiles).
- Clarifier le rôle du worker dédié vs workers embarqués API pour éviter doublon.
- Monitoring-server:
- Vérifier image runtime + migration strategy.

3. **Rendre la qualité passante**
- Corriger erreurs lint bloquantes du dashboard (types `any`, règles React hooks/Compiler, purity).
- Faire passer `bun run build` pour tous les workspaces.
- Ajouter scripts manquants standardisés:
- `test`, `typecheck` dans apps pertinentes.

4. **Sécuriser l’exécution prod**
- Validation env `zod` au boot (fail-fast).
- Restreindre `/metrics` (auth ou réseau interne).
- Vérifier mode fail-closed auth côté dashboard/proxy en prod.
- Exposer uniquement API+dashboard; DB/Redis non exposés Internet.

5. **Migrations et opérations**
- Ajouter job de migration explicite avant rollout.
- Interdire `db:push` en prod.
- Documenter backup/restore Postgres + test restore.
- Documenter rotation secrets (admin key/api hash secret).

6. **CI/CD compatible Dokploy + VPS**
- CI GitHub Actions:
- install, lint, build, tests, validation compose.
- Security checks (`bun audit`, dépendances).
- CD:
- build/push images taggées.
- webhook Dokploy pour déploiement.
- procédure VPS manuelle/automatisée (ssh + compose pull/up).

7. **Intégration Symfony native dans iAutos API**
- Dans `/home/kev/Documents/lab/sites/saas/iautos/api`, ajouter un service client ErrorWatch (HTTP).
- Ajouter un EventSubscriber Symfony pour capter exceptions applicatives.
- Mapper payload vers contrat ErrorWatch (`message`, `file`, `line`, `stack`, `env`, `url`, `level`, `created_at`).
- Ajouter garde-fous:
- timeout court + retry limité.
- non-bloquant (ne jamais casser la réponse métier si ErrorWatch indisponible).
- logs dédiés (channel app) avec masquage de secrets.
- ajouter config env et wiring DI (`config/services/*.yaml`).

8. **Validation locale end-to-end (obligatoire)**
- Lancer stack ErrorWatch locale.
- Configurer iAutos avec `ERRORWATCH_API_URL` + `ERRORWATCH_API_KEY`.
- Déclencher exception contrôlée depuis iAutos.
- Vérifier:
- `202` côté endpoint ErrorWatch.
- job consommé par worker.
- ligne créée en base ErrorWatch (group/event).
- issue visible dans dashboard.

## Tests et scénarios d’acceptation

1. **Gates qualité**
- `bun run lint` passe.
- `bun run build` passe.
- tests repo ErrorWatch disponibles et passants.

2. **Déploiement**
- `docker compose -f docker-compose.prod.yml config` valide.
- stack démarre en profil `dokploy` puis `vps`.
- healthchecks `healthy`.

3. **Sécurité**
- `/metrics` non accessible publiquement sans auth.
- Redis/Postgres non exposés.
- démarrage refusé si secrets obligatoires manquants.

4. **Intégration iAutos**
- test fonctionnel Symfony -> ErrorWatch réussi.
- en cas d’indisponibilité ErrorWatch, iAutos continue de répondre sans 500 induit.
- logs iAutos tracent succès/échec d’envoi sans fuite de clé API.

5. **Compat Dokploy**
- déploiement via image + env vars + volumes fonctionne.
- rollback possible au tag précédent.

## Hypothèses et choix par défaut
1. Cible: **MVP robuste** (pas conformité enterprise immédiate).
2. Déploiement initial mono-noeud (VPS ou Dokploy).
3. Intégration iAutos priorisée en **Symfony native** (pas simple smoke HTTP manuel).
4. Aucun changement métier iAutos hors instrumentation erreur/observabilité.
5. Les deux repos restent séparés; orchestration locale documentée via variables d’environnement et compose.
