# ErrorWatch Deployment

The standard production path is the GHCR self-host bundle. The server only needs:

- `docker-compose.selfhost.yml`
- `Caddyfile`
- `run-selfhost.sh`
- `.env` kept locally on the server

## Self-hosted bundle

```bash
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/docker-compose.selfhost.yml
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/.env.selfhost.example
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/Caddyfile
curl -O https://raw.githubusercontent.com/MakFly/errorwatch/main/run-selfhost.sh

cp .env.selfhost.example .env
chmod +x run-selfhost.sh
nano .env
./run-selfhost.sh install
```

## Server prerequisites

```bash
sudo apt-get update
sudo apt-get install -y curl docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

## DNS and TLS

- `DOMAIN` must resolve to your server public IP
- `api.${DOMAIN}` must resolve to the same server
- keep inbound `80/tcp` and `443/tcp` open for ACME
- the standard self-host path assumes public ACME certificates via Caddy

If you close or allowlist `80/443`, Caddy may fail to issue or renew a public certificate and Chrome will stop trusting the site.

## Required `.env`

Minimum values:

```bash
DOMAIN=errorwatch.example.com
ACME_EMAIL=admin@example.com
DASHBOARD_URL=https://errorwatch.example.com
API_URL=https://api.errorwatch.example.com
BETTER_AUTH_URL=https://api.errorwatch.example.com
POSTGRES_PASSWORD=<generated>
BETTER_AUTH_SECRET=<generated>
API_KEY_HASH_SECRET=<generated>
ADMIN_API_KEY=ew_admin_<generated>
USE_SECURE_COOKIES=true
```

Optional:

- `ERRORWATCH_VERSION=0.x.y` to pin a release
- `NEXT_PUBLIC_ENABLE_SSO=true|false`
- email / Stripe / OAuth secrets

## Operations

```bash
./run-selfhost.sh install
./run-selfhost.sh deploy
./run-selfhost.sh status
./run-selfhost.sh health
./run-selfhost.sh logs
./run-selfhost.sh backup-db
```

## GitHub Actions CD

Workflow: `.github/workflows/cd-production.yml`

Server path:

- `/opt/errorwatch`

Required repository secrets:

- `PROD_HOST`
- `PROD_USER`
- `PROD_SSH_KEY`

The workflow:

1. uploads `docker-compose.selfhost.yml`, `Caddyfile`, and `run-selfhost.sh`
2. updates `ERRORWATCH_VERSION` inside `/opt/errorwatch/.env`
3. runs `./run-selfhost.sh deploy`

Recommended:

- use GitHub Environment `production` with required reviewers
- prepare `/opt/errorwatch/.env` once manually before the first deploy
- deploy a specific release version, not `latest`

## Advanced source-build mode

`docker-compose.prod.yml` and the `deploy/*.sh` scripts remain available for contributors or custom builds, but they are no longer the primary production path.
