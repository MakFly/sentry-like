# ===========================================
# ErrorWatch Dashboard Dockerfile
# Production-hardened multi-stage build
# ===========================================

# Pin version for reproducible builds
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# Labels for container metadata
LABEL org.opencontainers.image.title="ErrorWatch Dashboard"
LABEL org.opencontainers.image.description="Error monitoring dashboard"
LABEL org.opencontainers.image.vendor="ErrorWatch"

# ===========================================
# Dependencies stage
# ===========================================
FROM base AS deps

# Copy only package files for better caching
COPY package.json bun.lockb* ./

# Install all dependencies (needed for build)
RUN bun install --frozen-lockfile

# ===========================================
# Build stage
# ===========================================
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and config
COPY package.json bun.lockb* next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs ./

# Copy source files
COPY src ./src
COPY public ./public

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application
RUN bun run build

# ===========================================
# Production stage
# ===========================================
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Copy built application (standalone output)
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start server
CMD ["bun", "run", "server.js"]
