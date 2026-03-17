# ErrorWatch Production Deployment

Two deployment modes are available:

## Mode 1: Pre-built Docker images (recommended for self-hosters)

Use `docker-compose.selfhost.yml` with images from GitHub Container Registry. No build tools needed.

```bash
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/docker-compose.selfhost.yml
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/.env.selfhost.example
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/deploy/Caddyfile
cp .env.selfhost.example .env && nano .env
docker compose -f docker-compose.selfhost.yml up -d
```

Database migrations run automatically on API startup.

## Mode 2: Build from source (for contributors / custom builds)

Use `docker-compose.prod.yml` which builds images locally from the Dockerfile.

```bash
git clone https://github.com/MakFly/errorwatch.git /opt/errorwatch
cd /opt/errorwatch
cp deploy/.env.production.example .env.production && nano .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Files

| File | Purpose |
|------|---------|
| `deploy/first-init-deploy.sh` | First server bootstrap + initial full deploy |
| `deploy/deploy.sh` | Update deploy (pull/build/migrate/reload/checks) |
| `deploy/oneshot-deploy.sh` | Deprecated wrapper to `first-init-deploy.sh` |
| `deploy/.env.production.example` | Production env template |
| `deploy/Caddyfile` | Caddy config used by Docker service |
| `docker-compose.prod.yml` | Docker services — build from source |
| `docker-compose.selfhost.yml` | Docker services — pre-built GHCR images |

## Server prerequisites

```bash
sudo apt-get update
sudo apt-get install -y curl git docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

## 2) Deploy code

```bash
git clone <repo-url> /opt/errorwatch
cd /opt/errorwatch
```

## 3) Configure environment

```bash
cp deploy/.env.production.example .env.production
nano .env.production
```

Minimum secrets:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -base64 24   # API_KEY_HASH_SECRET
```

## 4) DNS / firewall

- `DOMAIN` must resolve to your server public IP
- open inbound `80/tcp` and `443/tcp` (and optionally SSH)
- if `CADDY_HTTP_PORT`/`CADDY_HTTPS_PORT` are changed, adjust firewall and LB rules

### Optional hardening (UFW + Fail2ban)

Script:
- `deploy/hardening-ufw-fail2ban.sh`

Behavior:
- install/configure `ufw` + `fail2ban`
- default policy: deny incoming, allow outgoing
- allow SSH on `22/tcp`
- allow Docker bridge network (`172.16.0.0/12`) to local app upstream ports `3333` and `4001`
- `80/443` only if `ALLOWED_WEB_IPS` is provided at runtime

Usage without hardcoding IPs in repository:

```bash
ALLOWED_WEB_IPS="x.x.x.x/32 y.y.y.y/32" bash deploy/hardening-ufw-fail2ban.sh
```

Manual allowlist (recommended for sensitive production):

```bash
sudo ufw allow from x.x.x.x/32 to any port 80 proto tcp
sudo ufw allow from x.x.x.x/32 to any port 443 proto tcp
sudo ufw status numbered
```

Troubleshooting blocked access:

```bash
# On your client, check current public egress IP (VPN can change it)
curl -s https://api64.ipify.org

# On server, inspect UFW block logs
sudo journalctl -k --since "-30 min" --no-pager | grep "UFW BLOCK"
```

## 5) First deployment (new server)

```bash
./deploy/first-init-deploy.sh .env.production
```

## 6) Subsequent deployments (updates)

```bash
./deploy/deploy.sh .env.production
```

What the deployment flow does:

1. `bun install --frozen-lockfile`
2. starts PostgreSQL + Redis
3. builds API + dashboard Docker images
4. ensures DB role/database
5. runs migrations (auto via entrypoint)
6. starts/reloads all Docker services
7. runs local health checks

## Useful operations

```bash
# Docker services
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml restart

# Re-deploy (updates)
git pull
./deploy/deploy.sh .env.production
```

## GitHub Actions CD setup

Workflow: `.github/workflows/cd-production.yml`

Expected server path:

- `/opt/errorwatch`

Required repository secrets:

- `PROD_HOST`
- `PROD_USER`
- `PROD_SSH_KEY`

The workflow runs:

1. `git fetch` + `git pull --ff-only` on server
2. `./deploy/deploy.sh .env.production`

Recommended:

- use GitHub Environment `production` with required reviewers
- keep server working tree clean (workflow fails if dirty)
