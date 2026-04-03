# Docker Release Workflow

## Push new version

**Pour déployer une nouvelle version des images Docker (api + web) :**

1. **Créer un tag de release** ( bump version + tag Git ) :
   ```bash
   # Bump patch version & git tag
   bumpver update --patch
   git push --follow-tags
   ```

2. **Le workflow GitHub Actions** se déclenche automatiquement sur le tag `v*` :
   - Build + push images vers GHCR
   - Tags: `vX.Y.Z`, `X.Y`, `latest`

3. **En production (self-host)** :
   ```bash
   # Premier déploiement (infrastructure + app)
   ./run-selfhost.sh init-deploy

   # Mise à jour (app uniquement, infra déjà running)
   ./run-selfhost.sh deploy
   ```

## Commandes

| Action | Commande |
|--------|----------|
| Nouvelle release | `bumpver update --patch && git push --follow-tags` |
| First deploy | `./run-selfhost.sh init-deploy` |
| Update | `./run-selfhost.sh deploy` |
| Check status | `./run-selfhost.sh status` |

## Notes

- `deploy` = api + web uniquement (假设 infra déjà up)
- `init-deploy` = full stack (postgres + redis + caddy + api + web)
- Images GHCR: `ghcr.io/makfly/errorwatch-api` & `ghcr.io/makfly/errorwatch-web`