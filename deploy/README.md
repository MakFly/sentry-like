# ErrorWatch VPS Deployment

## Files

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Docker services config |
| `.env.example.prod` | Environment variables template |
| `Caddyfile` | Reverse proxy config (copy to `/etc/caddy/Caddyfile`) |

## Deployment Steps

### 1. Prepare environment

```bash
# On VPS, clone the repo
git clone <repo-url> /opt/errorwatch
cd /opt/errorwatch

# Create environment file
cp .env.example.prod .env.prod

# Edit and fill in values
nano .env.prod
```

### 2. Generate secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate POSTGRES_PASSWORD
openssl rand -base64 24
```

### 3. Configure Caddy

```bash
# Copy Caddyfile content to system Caddy
sudo nano /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### 4. Deploy

```bash
# Build and start services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### 5. Run migrations (first time only)

```bash
# Enter API container
docker exec -it errorwatch-api sh

# Run migrations
bunx drizzle-kit push
```

## Useful Commands

```bash
# View status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f dashboard

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop all
docker compose -f docker-compose.prod.yml down

# Update deployment
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Ports

| Service | Internal | External |
|---------|----------|----------|
| Dashboard | 3000 | 3001 |
| API | 3333 | 3333 |
| PostgreSQL | 5432 | - (internal) |
| Redis | 6379 | - (internal) |
