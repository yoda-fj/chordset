# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

COPY package.json package-lock.json* ./
# Skip Playwright browser download (~300MB) - runner stage uses Alpine Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# npm ci resolve sem --legacy-peer-deps: lucide-react@^1.24.0 já declara
# peer react ^19 (a flag foi adicionada quando a versão antiga não suportava React 19)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and start up
FROM base AS runner
WORKDIR /app

ENV DATABASE_PATH=/data/chordset.db
ENV AUDIO_STORAGE_PATH=/data/audio
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

# curl: healthcheck | su-exec: troca para usuário não-root no entrypoint
# (git removido: não é usado em runtime)
RUN apk add --no-cache curl su-exec

# Create data directories - volume will mount here
RUN mkdir -p /data/audio/musicas /data/audio/eventos

# Don't change ownership of /data - let volume handle it
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create symlink for drum samples from /data volume (avoiding Docker volume loop)
RUN mkdir -p /app/public && ln -s /data/samples/drums /app/public/drum-samples

# Create symlinks for audio uploads from /data volume (persistent storage)
RUN ln -s /data/audio/musicas /app/public/musicas-audio \
    && ln -s /data/audio/eventos /app/public/eventos-audio

# Roda como não-root: o entrypoint (root) faz chown de /data (volume montado em
# runtime como root-owned) e depois exec su-exec nextjs node server.js.
# USER root->chown->USER nextjs no build NÃO funcionaria: o volume sobrescreve
# as permissões do build no momento do mount.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]