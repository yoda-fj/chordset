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

# Install Chromium for cifra scraping (Alpine package)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    cairo \
    pango \
    gdk-pixbuf \
    ttf-freefont \
    udev

# Point Playwright to system chromium
ENV PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install curl and git for healthcheck and drum samples download
RUN apk add --no-cache curl git

# Create data directory - volume will mount here
RUN mkdir -p /data

# Don't change ownership of /data - let volume handle it
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Download drum samples (not in git, 264MB)
# Repo has "GSCW Drums Kit 1 Samples" and "GSCW Drums Kit 2 Samples"
RUN mkdir -p public/samples/drums/kick public/samples/drums/snare \
    public/samples/drums/hihat-closed public/samples/drums/hihat-open \
    public/samples/drums/crash public/samples/drums/ride \
    public/samples/drums/tom && \
    cd public/samples/drums && \
    git clone --depth 1 https://github.com/gregharvey/drum-samples.git && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/kick/* kick/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/snare/* snare/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/hihat/* hihat-closed/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/crash/* crash/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/ride/* ride/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 1\ Samples/tom/* tom/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 2\ Samples/kick/* kick/ 2>/dev/null || true && \
    cp drum-samples/GSCW\ Drums\ Kit\ 2\ Samples/snare/* snare/ 2>/dev/null || true && \
    rm -rf drum-samples

# Run as root to allow writing to volume mount (Coolify manages permissions)
USER root

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]