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
bun run dev  # Starts both dashboard (3001) and API (3333)
```

- **Dashboard**: http://localhost:3001
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

## Self-Hosting

### Production Deployment

See [deploy/README.md](./deploy/README.md) for full VPS deployment guide.

```bash
# Quick deploy with Docker Compose
cp .env.example.prod .env.prod
# Edit .env.prod with your values

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 1GB | 2GB+ |
| CPU | 1 vCPU | 2 vCPU+ |
| Storage | 10GB | 20GB+ |

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
