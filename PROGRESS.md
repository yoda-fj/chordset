# ChordSet - Progresso e Features

## 🏁 Fase 0 — Fundação Crítica (CONCLUÍDA 2026-09-03, branch `fase-0-fundacao`)

Plano: `docs/PLANO-TRIPLE-A.md` (v2, aprovado por 3 agentes revisores — ver `docs/aaa-reviews/`)

- [x] **0.10 Backup**: export/import JSON (`POST /api/backup/export|import`, scripts CLI) — restore verificado: 7 tabelas idênticas linha a linha
- [x] **0.2 Auth**: bypass de `/api/cifraclub/*` REMOVIDO (401 sem credencial, verificado via curl); allowlist explícita de extensões estáticas; rate limit 20 req/min por IP (429 + Retry-After) em scraping/OCR/import — `src/lib/rate-limit.ts` com 5 testes
- [x] **0.3 Áudio persistente**: uploads em `AUDIO_STORAGE_PATH` (default `./data/audio`, prod `/data/audio`) — sobrevivem a redeploy; symlinks no Dockerfile; `scripts/migrate-audio.ts`; teste E2E real de upload+serve
- [x] **0.9 Scraper hotfix**: `context.close()` no finally (fim do vazamento), mutex serializando scrapes, re-launch em `disconnected`. ⚠️ **Scraping falhando em 03/09**: seletor `.cifra_cnt` não encontrado (site mudou ou bloqueia headless) — reengenharia fetch+Cheerio (3B.4) ganhou prioridade
- [x] **0.1+0.4 Integridade**: `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL`; migrations versionadas (`schema_migrations`, 001 base + 002 UNIQUE(evento_id,ordem)); `scripts/sanitize-orphans.ts` (dry-run padrão; banco real: **0 órfãos**); testes de cascade (8)
- [x] **0.5 Validação**: zod em OCR/import/musicas/áudio (400 com issues; 413 > 15MB); dedup de import via query parametrizada; 17 testes
- [x] **0.6 CI**: `.github/workflows/ci.yml` (quality em PR: `lint:ci` zero-warning + tsc + test; docker-build só na main); warning `<img>` corrigido (next/image unoptimized); vitest exclui `.next`
- [x] **0.7 Docker hardening**: ver seção Docker/Deploy abaixo
- [x] **0.8 Spike PWA**: **GO** — Serwist 9.5.12 funciona via `next build --webpack` (Turbopack gera falso positivo: exit 0 sem sw.js!). Detalhes em `docs/aaa-reviews/07-spike-pwa.md`. Pendente para 3B: Dockerfile precisa copiar `public/` no estágio final e build apontar para webpack

**Gate ao fim da Fase 0:** tsc ✅ · lint:ci 0 warnings ✅ · 73 testes ✅

## 🚀 Funcionalidades Implementadas

### Core
- [x] CRUD de Músicas (com tags, tom, cifra)
- [x] CRUD de Templates (listas de música reutilizáveis)
- [x] CRUD de Eventos (com repertório)
- [x] Modo Performance/Setlist (para tocar ao vivo)
- [x] Transposição de tom em tempo real
- [x] Wake Lock API (mantém tela acesa no mobile)
- [x] Scroll speed control (⏹ → 1x → 2x → 3x)
- [x] Fullscreen mode (esconde header e footer, mostra controles flutuantes)
- [x] Controles de fonte (🔍- / 🔍+)

### Study List
- [x] Checkbox "É uma lista de estudo" na criação
- [x] Na edição: toggle escondido quando já é study list (travado)
- [x] Só mostra nome e observações (sem data, hora, local, status, tags)
- [x] View page trata data null como study list

### Reordenação
- [x] Drag-and-drop no SetlistBuilder (eventos e templates)
- [x] Persiste no banco via API de reorder
- [x] DragOverlay para melhor experiência mobile

### Importação de Cifra
- [x] Importar via Cifra Club (busca + extrai do site)
  - Exibe capa do álbum/música na lista de resultados (campo `imgm`)
- [x] Importar via Foto (📷) com LLM de visão
  - Providers: OpenAI (GPT-4o), Google (Gemini 2.0 Flash), OpenRouter (Claude)
  - Revisão antes de salvar (editar título, artista, tom, cifra)
  - API keys configuradas via variáveis de ambiente

### Ensaios (Prática)
- [x] Tabela `practice_sessions` no banco
- [x] CRUD completo via API
- [x] Página de lista com filtros por status
- [x] Página de criação (seleciona música + dificuldade)
- [x] Página de detalhe com cronômetro e metrônomo
- [x] Status: needs_practice, practiced, mastered
- [x] Dificuldade: easy, medium, hard
- [x] Observações por sessão
- [x] Tempo acumulado de prática
- [x] Componente CifraViewer reutilizável (transpose, fonte, fullscreen, autoscroll)

### Docker / Deploy
- [x] Dockerfile multistage
- [x] Basic Auth via middleware
- [x] Output standalone no next.config.js
- [x] Hardening (Tarefa 0.7): container roda como usuário não-root `nextjs` (uid 1001)
  - `docker-entrypoint.sh` (root) faz `chown -R nextjs:nodejs /data` em runtime e
    executa `su-exec nextjs node server.js` — necessário porque o volume /data do
    Coolify é montado root-owned e sobrescreve permissões de build
  - `git` removido da imagem final (mantido `curl` p/ healthcheck + `su-exec`)
  - `--legacy-peer-deps` removido do `npm ci`: a flag entrou no commit b84fa85
    ("React 19 compatibility") quando o lucide-react não declarava peer react 19;
    `lucide-react@^1.24.0` atual declara `react: ^16.5.1 || ^17 || ^18 || ^19`,
    e `npm ci` sem a flag instala os 519 pacotes sem ERESOLVE (validado localmente)
- [x] Variáveis BASIC_AUTH_USER/BASIC_AUTH_PASSWORD

### UI/UX
- [x] Sidebar colapsável (mobile/tablet)
- [x] Menu: Eventos → Templates → Músicas → Ensaios
- [x] Clone de eventos
- [x] Importar repertório de template
- [x] Responsivo (mobile-first)
- [x] Componente MusicaCard simplificado (removeu campos Resp e OK)
- [x] Auto-save de mudanças em músicas do evento (tom, observações)

## 🔧 Pending / Bugs

### Pending
- [x] Corrigir layout da cifra para ocupar altura total (removido maxHeight fixo, usando flex-1)
- [ ] Testar import via foto em produção (precisa de API key configurada)
- [ ] Testar reorder no mobile
- [ ] Deploy no Coolify e testar persistent storage

## 📋 Configuração

### Variáveis de Ambiente (.env.local)
```
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=senhaForte
DATABASE_PATH=./data/chordset.db
OPENAI_API_KEY=sk-...          # Opcional
GEMINI_API_KEY=...             # Opcional  
OPENROUTER_API_KEY=sk-or-...   # Opcional
```

### Tech Stack
- Next.js 16.2.3
- React (atualizado junto)
- SQLite via better-sqlite3
- Tailwind CSS
- @dnd-kit/core + @dnd-kit/sortable (drag-and-drop)
- Lucide React (ícones)
- Playwright + Cheerio (scraping Cifra Club, server-side)
- Tone.js (metrônomo/drum pad)
- Vitest (testes dos módulos puros: transposer, tag-utils, api-helpers)

## 📝 Notas

- Build de produção: `next start` (não `next dev`) para evitar WebSocket errors no acesso via rede
- Basic Auth protege todas as rotas via src/middleware.ts
- Study list: evento com `data = null` no banco
- Para acesso via rede local: next.config.js com `allowedDevOrigins: ['192.168.15.3', '192.168.15.4']`
- Qualidade: `npm run lint` (ESLint 9 flat config), `npm test` (Vitest), `npx tsc --noEmit`
- Tipos de domínio: fonte única em `src/types/database.ts` (módulos `src/lib/*-db.ts` importam de lá)
- Helpers de API: `jsonError`/`parseId`/áudio em `src/lib/api-helpers.ts`
- Transposição de cifra: engine única em `src/utils/chord-transposer.ts` (regex; CifraViewer transpõe o texto antes de renderizar)
