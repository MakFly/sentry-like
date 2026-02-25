# ErrorWatch OneShot Production Deployment (VPS/EC2/Scaleway)

Target topology:

- API + Dashboard on host via PM2
- PostgreSQL + Redis + Caddy in Docker (`docker-compose.prod.yml`)
- Caddy reverse-proxy to PM2 apps through `host.docker.internal`

## Files

| File | Purpose |
|------|---------|
| `deploy/oneshot-deploy.sh` | Full idempotent deployment (build + infra + migrate + PM2 + Caddy + checks) |
| `deploy/ecosystem.config.cjs` | PM2 process definitions |
| `deploy/.env.production.example` | Production env template |
| `deploy/Caddyfile` | Caddy config used by Docker service |
| `docker-compose.prod.yml` | Docker services (caddy/postgres/redis) |

## 1) Server prerequisites

```bash
sudo apt-get update
sudo apt-get install -y curl git docker.io docker-compose-plugin
sudo systemctl enable --now docker

# Bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# PM2
bun add -g pm2
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
- allow Docker bridge network (`172.16.0.0/12`) to local app upstream ports `3333` and `4001` (required for Caddy container -> host PM2 apps)
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

## 5) Run one-shot

```bash
./deploy/oneshot-deploy.sh .env.production
```

What it does:

1. `bun install --frozen-lockfile`
2. starts PostgreSQL + Redis
3. builds API + dashboard
4. ensures DB role/database
5. runs migrations
6. starts/reloads PM2 apps
7. starts/reloads Caddy container
8. runs local health checks

## Useful operations

```bash
# PM2
bunx pm2 list
bunx pm2 logs
bunx pm2 restart errorwatch-api
bunx pm2 restart errorwatch-dashboard

# Docker infra + proxy
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f postgres
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f redis

# Re-deploy
git pull
./deploy/oneshot-deploy.sh .env.production
```
