<div align="center">

# ErrorWatch

**Self-hosted error monitoring for modern applications**

A lightweight, privacy-focused alternative to Sentry. Monitor errors, track performance, and replay user sessions — all on your own infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.0-E36002?logo=hono)](https://hono.dev/)

[Dashboard](#dashboard) • [SDKs](#sdks) • [Self-Hosting](#self-hosting) • [Documentation](#documentation)

</div>

---

## Features

- **Error Tracking** — Automatic error capture with fingerprinting and grouping
- **Session Replay** — Replay user sessions with rrweb integration
- **Performance Monitoring** — Track request durations, database queries, and more
- **Multi-tenant** — Organizations, projects, and role-based access control
- **Real-time Dashboard** — Modern Next.js dashboard with tRPC
- **Privacy-First** — Self-hosted, your data never leaves your infrastructure
- **Lightweight SDKs** — JavaScript, React, Vue, Symfony, Laravel

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Dashboard** | Next.js 16, tRPC 11, shadcn/ui, TailwindCSS |
| **API Server** | Hono.js 4, Drizzle ORM, PostgreSQL, Redis, BullMQ |
| **SDKs** | TypeScript, PHP 8.1+ |
| **Auth** | BetterAuth |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ / Bun
- PostgreSQL 16
- Redis 7

### 1. Clone & Install

```bash
git clone https://github.com/MakFly/sentry-like.git errorwatch
cd errorwatch
bun install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL & Redis
docker compose up -d

# Optional: custom host ports (avoid conflicts)
# DOCKER_POSTGRES_PORT=55440 DOCKER_REDIS_PORT=56390 docker compose up -d
```

### 3. Configure Environment

```bash
# Monitoring Server
cp apps/monitoring-server/.env.example apps/monitoring-server/.env

# Dashboard
cp apps/dashboard/.env.example apps/dashboard/.env
```

### 4. Setup Database

```bash
cd apps/monitoring-server
bunx drizzle-kit push
```

### 5. Run Development Servers

```bash
# From project root
make dev

# Or manually:
bun run dev  # Starts dashboard (4000) and API (3333) via Turbo
```

- **Dashboard**: http://localhost:4000
- **API**: http://localhost:3333

## Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────┐
│  Client Apps    │────▶│ Monitoring Server │◀────│  Dashboard  │
│  (SDKs)         │     │ (Hono + Postgres)  │     │  (Next.js)  │
└─────────────────┘     └───────────────────┘     └─────────────┘
       POST /event              ▲                    tRPC + REST
                                │
```

## SDKs

### JavaScript / TypeScript

```bash
npm install @errorwatch/sdk
```

```typescript
import { ErrorWatch } from '@errorwatch/sdk';

ErrorWatch.init({
  dsn: 'https://your-api.com',
  apiKey: 'your-project-api-key',
});
```

### React

```tsx
import { ErrorBoundary } from '@errorwatch/sdk/react';

<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Vue

```typescript
import { createApp } from 'vue';
import { ErrorWatchPlugin } from '@errorwatch/sdk/vue';

const app = createApp(App);
app.use(ErrorWatchPlugin, { dsn: '...', apiKey: '...' });
```

### Symfony

```bash
composer require errorwatch/sdk-symfony
```

```php
// config/packages/errorwatch.yaml
errorwatch:
  dsn: 'https://your-api.com'
  api_key: '%env(ERRORWATCH_API_KEY)%'
```

### Laravel

```bash
composer require errorwatch/sdk-laravel
```

```php
// config/errorwatch.php
return [
    'dsn' => env('ERRORWATCH_DSN'),
    'api_key' => env('ERRORWATCH_API_KEY'),
];
```

### System Metrics (Go Agent)

See [errorwatch-sdk-metrics](https://github.com/MakFly/errorwatch-sdk-metrics) for the system metrics collection agent.

```bash
# Download binary
curl -L -o sdk-metrics https://github.com/MakFly/errorwatch-sdk-metrics/releases/latest/download/sdk-metrics

# Or build from source
git clone https://github.com/MakFly/errorwatch-sdk-metrics.git
cd errorwatch-sdk-metrics
go build -o sdk-metrics .

# Run
./sdk-metrics --init
./sdk-metrics -c sdk-metrics.yaml
```

## Self-Hosting

### Deployment Model

Recommended production topology:

- **Apps (API + Dashboard)** run natively with **PM2**
- **PostgreSQL + Redis** run in Docker (`docker-compose.prod.yml`)
- **Caddy** handles TLS termination and reverse proxy

This is exactly what the one-shot script automates:

- [deploy/oneshot-deploy.sh](./deploy/oneshot-deploy.sh)
- [deploy/ecosystem.config.cjs](./deploy/ecosystem.config.cjs)
- [deploy/Caddyfile](./deploy/Caddyfile)
- [deploy/SECURITY-HARDENING-UFW-FAIL2BAN.md](./deploy/SECURITY-HARDENING-UFW-FAIL2BAN.md)

### Security Hardening Guide

For a complete production firewall and SSH protection setup (UFW + Fail2ban + Docker `DOCKER-USER` allowlist enforcement), follow:

- [Security Hardening: UFW + Fail2ban](./deploy/SECURITY-HARDENING-UFW-FAIL2BAN.md)

### Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2GB | 4GB+ |
| CPU | 2 vCPU | 4 vCPU+ |
| Storage | 20GB | 50GB+ SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |

Required software:

- Docker Engine + Docker Compose plugin
- Bun 1.x
- PM2

### Production (One-Shot) Setup

1. Clone on your VPS:

```bash
git clone https://github.com/MakFly/sentry-like.git /opt/errorwatch
cd /opt/errorwatch
```

2. Create production env:

```bash
cp deploy/.env.production.example .env.production
nano .env.production
```

3. Generate strong secrets:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -base64 24   # API_KEY_HASH_SECRET
```

4. Configure DNS and firewall:

```bash
# DOMAIN must resolve to your server IP
# Open inbound 80/tcp and 443/tcp
```

5. Run one-shot deploy:

```bash
./deploy/oneshot-deploy.sh .env.production
```

### Dynamic Docker Ports (Conflict-Free)

To avoid conflicts with local Sentry stacks or existing services, database ports are configurable.

In `.env.production`:

```bash
DOCKER_POSTGRES_PORT=55432
DOCKER_REDIS_PORT=56379
```

You can change them to any free host ports.  
The deploy script and compose files use these values automatically.

### Required Environment Variables

Minimum required keys in `.env.production`:

```bash
# Public URLs
DOMAIN=errorwatch.io
ACME_EMAIL=admin@errorwatch.io
DASHBOARD_URL=https://errorwatch.io
API_URL=https://api.errorwatch.io
BETTER_AUTH_URL=https://api.errorwatch.io

# Infra ports
DOCKER_POSTGRES_PORT=55432
DOCKER_REDIS_PORT=56379
CADDY_HTTP_PORT=80
CADDY_HTTPS_PORT=443

# Caddy Docker upstreams (PM2 on host)
DASHBOARD_UPSTREAM=host.docker.internal:4001
API_UPSTREAM=host.docker.internal:3333

# DB
POSTGRES_DB=errorwatch
POSTGRES_USER=errorwatch
POSTGRES_PASSWORD=CHANGE_ME
DATABASE_URL=postgresql://errorwatch:CHANGE_ME@localhost:55432/errorwatch

# Redis
REDIS_URL=redis://localhost:56379

# Security
BETTER_AUTH_SECRET=CHANGE_ME
ADMIN_API_KEY=ew_admin_CHANGE_ME
API_KEY_HASH_SECRET=CHANGE_ME
```

### Health Checks

After deployment:

```bash
curl -I http://127.0.0.1:3333/health/live
curl -I http://127.0.0.1:4001/
```

Expected: `HTTP 200`.

### Operations (Runbook)

```bash
# PM2 status/logs
bunx pm2 list
bunx pm2 logs
bunx pm2 restart errorwatch-api
bunx pm2 restart errorwatch-dashboard

# Infra status/logs
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f postgres
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f redis

# Re-deploy after updates
git pull
./deploy/oneshot-deploy.sh .env.production
```

### Local Self-Hosted (Without Production Proxy)

For local development with conflict-free infra ports:

```bash
# Optional port overrides
export DOCKER_POSTGRES_PORT=55432
export DOCKER_REDIS_PORT=56379

# Start local infra
docker compose -f docker-compose.dev.yml up -d

# Start apps
make dev-api        # API on 3333
make dev-dashboard  # Dashboard on 4001
```

Set `apps/monitoring-server/.env` using:

```bash
DATABASE_URL=postgresql://errorwatch:errorwatch_dev_password@localhost:55432/errorwatch
REDIS_URL=redis://localhost:56379
```

### Troubleshooting

- `ECONNREFUSED` to DB/Redis: verify `DOCKER_POSTGRES_PORT` / `DOCKER_REDIS_PORT` and matching `DATABASE_URL` / `REDIS_URL`
- `502` from Caddy: verify PM2 apps are running on `127.0.0.1:3333` and `127.0.0.1:4001`
- Migration errors: run `cd apps/monitoring-server && DATABASE_URL=... bun run db:migrate`
- App boot failures: inspect `bunx pm2 logs` first, then `docker compose ... logs postgres redis`

For the VPS-focused guide, see [deploy/README.md](./deploy/README.md).

## Project Structure

```
errorwatch/
├── apps/
│   ├── dashboard/           # Next.js 16 frontend
│   └── monitoring-server/   # Hono.js API server
├── packages/
│   ├── sdk/                 # Universal SDK (JS + React + Vue)
│   ├── shared/              # Shared types & utilities
│   ├── sdk-symfony/         # PHP Symfony Bundle
│   └── sdk-laravel/         # PHP Laravel SDK
├── deploy/                  # Production deployment files
└── examples/                # Integration examples
```

## Development

```bash
# Install dependencies
bun install

# Start dev servers
make dev

# Run tests
bun test

# Build all packages
bun run build

# Database migrations
cd apps/monitoring-server && bunx drizzle-kit push
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Sentry](https://sentry.io/)
- Built with [Hono](https://hono.dev/), [Next.js](https://nextjs.org/), and [Drizzle ORM](https://orm.drizzle.team/)
- Session replay powered by [rrweb](https://www.rrweb.io/)

---

<div align="center">

**[⬆ back to top](#errorwatch)**

Made with ❤️ by [MakFly](https://github.com/MakFly)

</div>
