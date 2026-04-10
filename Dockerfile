# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# SQLite needs native bindings
RUN npm rebuild sqlite3

RUN npm run build

# Production image, copy all the files and start up
FROM base AS runner
WORKDIR /app

ENV DATABASE_PATH=/data/chordset.db
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create data directory - volume will mount here
RUN mkdir -p /data

# Don't change ownership of /data - let volume handle it
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Run as root to allow writing to volume mount (Coolify manages permissions)
USER root

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
