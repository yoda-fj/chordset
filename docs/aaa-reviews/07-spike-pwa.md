# AAA — Spike 0.8: PWA "Hello Service Worker" (Next 16.2.3)

**Data:** 2026-09-03 · **Branch:** `fase-0-fundacao` · **Decisão: GO ✅** (via Serwist + `next build --webpack`)

## Pergunta do spike

Service worker compila e funciona no build de produção deste projeto (Next 16.2.3, Turbopack padrão, `next.config.js` CommonJS, `output: 'standalone'`)?

## Resposta curta

| Caminho | Resultado | Evidência |
|---|---|---|
| `@serwist/next` + `next build` (Turbopack) | ❌ **Falha silenciosa** — build passa (exit 0) mas `public/sw.js` **não é gerado** | log: `[@serwist/next] WARNING: ... doesn't support Turbopack` |
| `@serwist/next` + `next build --webpack` | ✅ **Funciona** — `sw.js` de 103 KB gerado com precache manifest injetado | log: `✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'` + `✓ Compiled successfully in 6.0s` |
| SW manual (`public/sw.js` à mão) | ⏭️ Não testado (desnecessário — Serwist funcionou via webpack) | — |

## Evidências detalhadas

### 1. Turbopack (build padrão): falha silenciosa

```
[@serwist/next] WARNING: You are using '@serwist/next' with `next dev --turbopack`,
but it doesn't support Turbopack. Do one of the following:
- Use webpack by running `next dev --webpack` instead of `next dev --turbopack`.
- Migrate to '@serwist/turbopack' which has experimental support for Turbopack.
...
▲ Next.js 16.2.3 (Turbopack)
✓ Generating static pages using 9 workers (23/23)
# exit=0, MAS: ls public/sw.js → No such file or directory
```

O plugin do Serwist é um **webpack plugin**; o Turbopack ignora `config.webpack` por completo. O build termina com exit 0 **sem SW e sem erro** — risco real de falso positivo em CI.

### 2. Webpack (`npx next build --webpack`): funciona de ponta a ponta

```
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 6.0s
```

`public/sw.js` gerado (103.364 bytes) com **precache manifest injetado**:

```
precacheEntries:[{'revision':'f1cb1cb75c745f58635ab8923ae476df',
'url':'/_next/static/.../_buildManifest.js'}, ... chunks 1860-....js ...]
```

### 3. Smoke test de runtime (`next start -p 3744`)

```
sw.js:  200 application/javascript; charset=UTF-8  103364B
/ :     200
/api/health: 200
```

## O que foi alterado neste spike (a revisar antes do commit)

1. **`package.json` (devDependencies, não-destrutivo):** `+ @serwist/next@9.5.12`, `+ serwist@9.5.12` (+ `package-lock.json`).
2. **`next.config.js`:** config virou função assíncrona (Serwist é ESM-only → `await import()`). `disable: process.env.NODE_ENV !== 'production'` para não poluir o dev com Turbopack.
3. **`src/app/sw.ts` (novo):** SW mínimo — precache dos assets do build + `defaultCache` (runtime caching do Serwist, inclui CacheFirst para assets/fontes/imagens e NetworkFirst para navegação).

## Impactos para a Fase 3B (PWA offline)

| Área | Impacto |
|---|---|
| **Build local/CI** | Produção precisa de `next build --webpack`. Opções: mudar script `"build"` para `next build --webpack`, ou criar `"build:pwa"`. Abre mão do Turbopack **apenas no build de produção** (dev continua Turbopack). |
| **Dockerfile** | ⚠️ **Dois pontos:** (a) `RUN npm run build` precisa apontar para o build webpack; (b) o estágio final **não copia `public/`** (só `.next/standalone` + `.next/static` + symlinks de áudio) — sem `COPY --from=builder /app/public ./public`, o `sw.js` (e o futuro `manifest.webmanifest`) **não existirão na imagem**. |
| **`.gitignore`** | Adicionar `public/sw.js*` (artefato de build, não deve ser commitado). |
| **Registro do SW** | Serwist não injeta registro: Fase 3B precisa de um componente `'use client'` com `navigator.serviceWorker.register('/sw.js')` (só em produção) + `manifest.webmanifest` + ícones. |
| **Rotas dinâmicas/SQLite** | Páginas `ƒ (Dynamic)` não entram no precache — offline delas exige runtime caching customizado (ex.: `StaleWhileRevalidate` para `/musicas`, `/eventos`) na config do `sw.ts`. Dados vêm do SQLite local do servidor: offline real = app shell + dados já cacheados. |
| **Alternativa não testada** | `@serwist/turbopack` (experimental, issue serwist#54 aberta) — não recomendado para produção agora. SW manual seria o plano B caso o webpack inviabilize algo no futuro (funciona com qualquer bundler, mas sem precache manifest automático). |

## Recomendação

**GO para a Fase 3B com Serwist + `next build --webpack`.** Custo: build de produção em webpack (mais lento que Turbopack, porém maduro e o único caminho suportado pelo Serwist hoje). O setup deste spike (devDeps + `next.config.js` + `src/app/sw.ts`) já é o esqueleto da 3B — falta apenas registro client-side, manifest, ícones e os ajustes de Dockerfile/CI acima.

## Comandos exatos para reproduzir

```bash
npm install -D @serwist/next serwist     # 9.5.12
# next.config.js: module.exports = async () => withSerwist(nextConfig)  (ver arquivo)
# src/app/sw.ts: Serwist + defaultCache (ver arquivo)
npm run build                            # Turbopack → SEM sw.js (falha silenciosa)
npx next build --webpack                 # → public/sw.js (103 KB, precache injetado)
npx next start -p 3744
curl -sI http://localhost:3744/sw.js     # 200 application/javascript
```

## Verificações finais (pós-spike)

- `npx tsc --noEmit` → exit 0
- `npm run lint` (eslint .) → exit 0
- `npm test` (vitest) → **56/56 passed** (6 arquivos)
- `public/sw.js` removido após o teste (artefato de build)
