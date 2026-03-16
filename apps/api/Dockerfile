# ===========================================
# ErrorWatch Monitoring Server Dockerfile
# Production-hardened multi-stage build
# ===========================================

# Pin version for reproducible builds
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# Labels for container metadata
LABEL org.opencontainers.image.title="ErrorWatch Monitoring Server"
LABEL org.opencontainers.image.description="Error monitoring API server"
LABEL org.opencontainers.image.vendor="ErrorWatch"

# ===========================================
# Dependencies stage
# ===========================================
FROM base AS deps

# Copy only package files for better caching
COPY package.json bun.lockb* ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ===========================================
# Build stage
# ===========================================
FROM base AS build

# Copy package files
COPY package.json bun.lockb* tsconfig.json drizzle.config.ts ./

# Install all dependencies (including dev deps for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src

# Build TypeScript
RUN bun run build

# ===========================================
# Production stage
# ===========================================
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 errorwatch && \
    adduser --system --uid 1001 errorwatch

# Create data directories
RUN mkdir -p /data/sourcemaps && \
    chown -R errorwatch:errorwatch /data

# Copy production dependencies
COPY --from=deps --chown=errorwatch:errorwatch /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=errorwatch:errorwatch /app/dist ./dist
COPY --from=build --chown=errorwatch:errorwatch /app/package.json ./

# Copy drizzle migrations if they exist
COPY --chown=errorwatch:errorwatch drizzle ./drizzle

# Environment
ENV NODE_ENV=production
ENV PORT=3333
ENV SOURCEMAPS_PATH=/data/sourcemaps

# Switch to non-root user
USER errorwatch

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/health/live || exit 1

# Start server
CMD ["bun", "run", "dist/index.js"]
