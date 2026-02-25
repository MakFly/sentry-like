# ErrorWatch OneShot Production Deployment (VPS)

Déploiement cible: apps en natif via PM2, PostgreSQL + Redis via Docker, reverse-proxy via Caddy.

## Fichiers

| File | Purpose |
|------|---------|
| `deploy/oneshot-deploy.sh` | Script complet idempotent (build + infra + migrate + PM2 + healthchecks) |
| `deploy/ecosystem.config.cjs` | Définition PM2 des processus API et Dashboard |
| `deploy/.env.production.example` | Template des variables d'environnement de production |
| `deploy/Caddyfile` | Configuration Caddy TLS + proxy |

## 1) Préparer le serveur

```bash
# Ubuntu/Debian example
sudo apt-get update
sudo apt-get install -y curl git docker.io docker-compose-plugin caddy
sudo systemctl enable --now docker caddy

# Bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# PM2
bun add -g pm2
```

## 2) Déployer le code

```bash
git clone <repo-url> /opt/errorwatch
cd /opt/errorwatch
```

## 3) Configurer l'environnement

```bash
cp deploy/.env.production.example .env.production
nano .env.production
```

Secrets minimum:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -base64 24   # API_KEY_HASH_SECRET
```

## 4) Configurer Caddy

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 5) Lancer le oneshot

```bash
./deploy/oneshot-deploy.sh .env.production
```

Le script fait automatiquement:

1. installation des dépendances (`bun install --frozen-lockfile`)
2. démarrage de PostgreSQL/Redis
3. build API + dashboard
4. création/synchronisation user+DB PostgreSQL
5. migrations Drizzle
6. démarrage/reload PM2
7. healthchecks locaux

## Commandes utiles

```bash
# PM2
bunx pm2 list
bunx pm2 logs
bunx pm2 restart errorwatch-api
bunx pm2 restart errorwatch-dashboard

# Docker infra
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f postgres
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f redis

# Re-deploy after git pull
./deploy/oneshot-deploy.sh .env.production
```
