# Monitoring Server

Error monitoring API built with **Hono.js + tRPC + SQLite**.

## Stack

- **Hono.js** - Fast web framework
- **tRPC** - Type-safe RPC (for Dashboard Next.js)
- **Drizzle ORM** - TypeScript-first ORM
- **SQLite** - Embedded database (no service needed)
- **TypeScript** - Type-safe development

## Architecture

**Classic pattern (not DDD)**:

```
src/
├── api/
│   ├── event/    # REST endpoint for Symfony bundle
│   ├── groups/   # tRPC procedures for dashboard
│   └── stats/    # tRPC procedures for dashboard
├── db/
│   ├── connection.ts  # Drizzle database
│   └── schema.ts      # Database tables
├── types/
└── router/       # tRPC router
├── trpc/          # tRPC init
└── index.ts       # Hono entry point
```

## API Endpoints

### REST (Symfony Bundle)

```
POST /event
Content-Type: application/json
X-API-Key: changeme

{
  "message": "...",
  "file": "...",
  "line": 123,
  "stack": "...",
  "env": "prod",
  "url": "/api/endpoint",
  "created_at": 1234567890
}
```

### tRPC (Dashboard)

```
POST /trpc/groups.getAll
POST /trpc/groups.getById
POST /trpc/groups.getEvents
POST /trpc/stats.getGlobal
```

## Running

```bash
# Development
bun run dev

# Build
bun run build

# Production
bun run start

# Database migrations
bun run db:push    # Create/update tables
bun run db:generate  # Generate migration files
bun run db:migrate  # Run migrations
```

## Development

Server runs on port 8000.

For dashboard development:
```bash
NEXT_PUBLIC_TRPC_URL=http://localhost:8000
```
