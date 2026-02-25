# Release Notes - Production Deployment Fixes

## Date: 2026-02-25

## Overview

This release addresses multiple issues discovered during the production deployment on a bare metal server without DNS configuration. The main challenge was getting the frontend and backend to communicate correctly through Caddy reverse proxy, handling Server-Sent Events (SSE), and managing cookies in a non-HTTPS environment.

---

## Issues Fixed

### 1. Database & Redis Connection (PM2)

**Problem:** PM2 processes couldn't connect to PostgreSQL and Redis running in Docker.

**Solution:** Updated `deploy/ecosystem.config.cjs` to use `host.docker.internal` instead of `localhost` for Docker services:

```javascript
DATABASE_URL: "postgresql://errorwatch:CHANGE_ME@localhost:55432/errorwatch"
REDIS_URL: "redis://localhost:56379"
```

### 2. PM2 Command Flag

**Problem:** `--update-env` flag doesn't exist in PM2.

**Solution:** Removed the invalid flag from `deploy/oneshot-deploy.sh`:

```bash
# Before
bunx pm2 startOrReload deploy/ecosystem.config.cjs --update-env

# After
bunx pm2 startOrReload deploy/ecosystem.config.cjs
```

### 3. Environment File Syntax

**Problem:** `.env.production` had invalid quoting for `EMAIL_FROM`.

**Solution:** Added proper quotes:

```bash
# Before
EMAIL_FROM=ErrorWatch <alerts@errorwatch.io>

# After
EMAIL_FROM="ErrorWatch <alerts@errorwatch.io>"
```

### 4. Bun Install Scripts

**Problem:** Build failed due to missing build tools in production environment.

**Solution:** Added `--ignore-scripts` flag:

```bash
bun install --frozen-lockfile --ignore-scripts
```

### 5. Database Migration Command

**Problem:** Using `db:migrate` with MySQL syntax in PostgreSQL.

**Solution:** Changed to `db:push`:

```bash
# Before
bun run db:migrate

# After
bun run db:push
```

### 6. Better-Auth Cookie Security

**Problem:** Cookies were marked as `Secure` in HTTP mode, causing authentication failures.

**Solution:** Updated `apps/monitoring-server/src/auth.ts` to conditionally set `secure` cookie flag:

```typescript
const useSecureCookies = process.env.USE_SECURE_COOKIES === "true" && isProduction;

advanced: {
  defaultCookieAttributes: {
    sameSite: "lax",
    secure: useSecureCookies,  // Only true when USE_SECURE_COOKIES=true
    httpOnly: true,
  },
}
```

### 7. Caddy Reverse Proxy Configuration

**Problem:** The frontend couldn't communicate with the API due to missing route configurations.

**Solution:** Updated `deploy/Caddyfile` with proper routing:

```caddy
http://51.158.55.137 {
    # Auth API -> backend
    @authApi path /api/auth/*
    reverse_proxy @authApi host.docker.internal:3333

    # SSE -> backend
    @sse path /sse/*
    reverse_proxy @sse host.docker.internal:3333

    # tRPC API -> dashboard (Next.js)
    @trpcApi path /api/trpc/*
    reverse_proxy @trpcApi host.docker.internal:4001

    # Other API routes -> backend
    @backendApi path /api/v1/*
    reverse_proxy @backendApi host.docker.internal:3333

    # Everything else -> dashboard
    reverse_proxy host.docker.internal:4001
}
```

### 8. SSE Endpoint Hardcoded URL

**Problem:** SSE (Server-Sent Events) was trying to connect to `localhost:3333` instead of the production URL.

**Solution:** Updated `apps/dashboard/src/hooks/useSSE.ts` to use environment variable:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_SSE_URL || 
               process.env.NEXT_PUBLIC_MONITORING_API_URL || 
               "http://localhost:3333";
```

### 9. Build Environment Variables

**Problem:** Frontend was built with incorrect API URLs.

**Solution:** Added proper build commands:

```bash
NEXT_PUBLIC_APP_URL=http://51.158.55.137 \
NEXT_PUBLIC_MONITORING_API_URL=http://51.158.55.137 \
NEXT_PUBLIC_SSE_URL=http://51.158.55.137:3333 \
bun run build
```

---

## Files Modified

| File | Changes |
|------|---------|
| `deploy/oneshot-deploy.sh` | Fixed PM2 command, DB config, bun install flags |
| `deploy/ecosystem.config.cjs` | Added environment variables, fixed DATABASE_URL/REDIS_URL |
| `deploy/Caddyfile` | Added reverse proxy rules for API, SSE, tRPC |
| `apps/monitoring-server/src/auth.ts` | Conditional secure cookie flag |
| `apps/dashboard/src/hooks/useSSE.ts` | Added NEXT_PUBLIC_SSE_URL support |
| `.env.production` | Fixed EMAIL_FROM quoting |

---

## Deployment Instructions

### Standard Deployment

```bash
./deploy/oneshot-deploy.sh
```

### Manual Restart (if needed)

```bash
# Rebuild dashboard with correct env vars
NEXT_PUBLIC_APP_URL=http://51.158.55.137 \
NEXT_PUBLIC_MONITORING_API_URL=http://51.158.55.137 \
NEXT_PUBLIC_SSE_URL=http://51.158.55.137:3333 \
bun run build

# Restart services
bunx pm2 restart all
docker restart errorwatch-caddy
```

### Environment Variables for Production

When using a domain with DNS:

```bash
BETTER_AUTH_URL=https://api.errorwatch.io
DASHBOARD_URL=https://errorwatch.io
NEXT_PUBLIC_APP_URL=https://errorwatch.io
NEXT_PUBLIC_MONITORING_API_URL=https://api.errorwatch.io
NEXT_PUBLIC_SSE_URL=https://api.errorwatch.io
USE_SECURE_COOKIES=true
```

---

## Known Limitations

1. **SSE via Caddy:** SSE (Server-Sent Events) may have issues when proxied through Caddy in HTTP mode. The current solution uses direct connection to port 3333 for SSE.

2. **HTTPS Required:** For production with real domains, ensure DNS is properly configured and HTTPS certificates are obtained via Let's Encrypt or similar.

---

## Testing Checklist

- [x] User signup works
- [x] User login works
- [x] Dashboard loads correctly
- [x] API endpoints respond
- [x] SSE connection works
- [x] tRPC calls work

---

## Changelog

- **v0.1.0** (2026-02-25): Initial production deployment fixes
