# ChordSet — Auditoria Técnica e de Arquitetura (Triple-A Review #02)

**Data:** 03/09/2026
**Escopo:** código-fonte completo, schema SQLite, middleware, Dockerfile, testes, pipeline de qualidade.
**Stack auditada:** Next.js 16.2.3 (App Router) · React 19 · better-sqlite3 · Tailwind CSS 3 · Tone.js · Playwright + Cheerio · Vitest 3.

---

## 1. Estado real das verificações de qualidade

| Verificação | Resultado | Observação |
|---|---|---|
| `npm run lint` (ESLint 9 flat config) | ✅ **0 erros, 1 warning** | Warning: `<img>` em `src/app/musicas/new/page.tsx:439` (usar `next/image`). |
| `npm test` (Vitest) | ✅ **38 testes passando em 3 arquivos** | Apenas módulos puros: `src/utils/chord-transposer.test.ts` (25), `src/utils/tag-utils.test.ts` (8), `src/lib/api-helpers.test.ts` (5). |
| `npx tsc --noEmit` | ✅ **Limpo, 0 erros** | Typecheck estrito passando. |

**Leitura:** a base está higienicamente saudável (lint/typecheck verdes), mas a cobertura de testes é cosmeticamente baixa — **zero testes** de API routes, camada de banco (`src/lib/*-db.ts`), componentes React ou fluxos e2e. Os 38 testes cobrem apenas funções utilitárias puras.

---

## 2. Pontos fortes

1. **Tipagem de domínio centralizada** — `src/types/database.ts` é fonte única de verdade; os módulos `src/lib/*-db.ts` importam daqui. Elimina drift de tipos.
2. **Camada de dados organizada por domínio** — `musicas-db.ts`, `eventos-db.ts`, `setlists-db.ts`, `template-musicas-db.ts`, `practice-sessions-db.ts`, `drum-patterns-db.ts`. Separação clara de responsabilidades.
3. **SQL injection mitigado** — todas as queries usam prepared statements do better-sqlite3 (verificado em `musicas-db.ts`, incluindo o UPDATE dinâmico que monta `SET` com placeholders).
4. **Helpers de API consistentes** — `src/lib/api-helpers.ts` com `jsonError`/`parseId` padronizados e `serveAudioFile` com **proteção real contra path traversal** (validação de `..`, `/`, `\` + `resolve()` prefixado).
5. **Schema com índices** — `idx_musicas_titulo`, `idx_musicas_artista`, `idx_eventos_data`, `idx_eventos_status`, índices de FK em `evento_musicas` e `template_musicas`.
6. **WAL mode habilitado** — `db.pragma('journal_mode = WAL')` em `src/lib/db.ts:12` permite leituras concorrentes durante escritas.
7. **Dockerfile multistage bem estruturado** — standalone output, healthcheck em `/api/health`, Chromium Alpine sem download do Playwright (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`).
8. **Middleware de Basic Auth funcional** (`src/middleware.ts`) com matcher correto excluindo assets estáticos.
9. **Streaming de áudio** — `serveAudioFile` usa `createReadStream` com `Content-Length` e `Cache-Control: immutable`, em vez de carregar arquivo inteiro em memória.
10. **Git higiênico** — `.env` não é rastreado (só `.env.example`), histórico de commits com convenção (`feat:`, `fix:`, `refactor:`).

---

## 3. Dívidas técnicas e riscos

### 3.1 🔴 CRÍTICO — Foreign keys desligadas no SQLite

`src/lib/db.ts` habilita apenas WAL. O pragma `foreign_keys` **nunca é ativado** — verificado no banco real:

```
$ sqlite3 data/chordset.db "PRAGMA foreign_keys;" → 0
```

Consequência: todas as cláusulas `ON DELETE CASCADE` / `ON DELETE SET NULL` declaradas em `data/schema.sql` (`evento_musicas`, `template_musicas`, `musicas.drum_pattern_id`, `practice_sessions`) **são silenciosamente ignoradas**. Deletar uma música deixa linhas órfãs em `evento_musicas` e `practice_sessions`. Correção de uma linha: `db.pragma('foreign_keys = ON')` — mas exige antes uma migration de limpeza de órfãos.

### 3.2 🔴 CRÍTICO — Rotas de scraping abertas sem autenticação

`src/middleware.ts:7-9` faz bypass de auth para `/api/cifraclub/*` **antes** da verificação de credenciais:

```ts
if (url.startsWith('/api/cifraclub/')) {
  return NextResponse.next()
}
```

Qualquer pessoa na internet pode usar o servidor como **proxy gratuito de scraping do Cifra Club**, consumindo CPU/memória do Chromium e expondo o deploy a abuso/bloqueio de IP. O mesmo vale na prática para `/api/import-song` se a intenção era protegê-lo — ele passa pelo auth, mas o bypass explícito das rotas `cifraclub` é um furo deliberado e perigoso.

### 3.3 🔴 CRÍTICO — Scraping do Cifra Club com Playwright em produção

`src/lib/cifraclub-scraper/cifraclub.ts` + `src/app/api/import-song/route.ts`:

- **Fragilidade extrema**: depende de seletores internos do Cifra Club (`.cifra_cnt pre`, `h1.t1`, `h2.t3`, `.tablatura`, `.g-ico.key`). Qualquer redesign quebra a importação silenciosamente — e não há teste, monitoramento ou alerta para detectar isso.
- **Recurso pesado no request path**: cada importação abre uma página no Chromium headless dentro do servidor web (timeout de 15s em `waitForSelector`). Sob Coolify/container com pouca RAM, poucos imports simultâneos derrubam o serviço.
- **Concorrência insegura**: o singleton `getScraper()` reutiliza um único `Browser` sem mutex/fila; `browser.newPage()` concorrente com crash do browser deixa `this.browser` apontando para uma instância morta (não há `browser.on('disconnected')` nem re-launch). O `finally` vazio no `scrape()` nem fecha a `Page` — **vazamento de páginas/contextos** a cada importação.
- **Sem rate limiting, sem cache, sem retry** — nem proteção própria nem cortesia ao site alvo (risco de ban de IP e questões de ToS).
- **Docker roda como root** (`Dockerfile:63` — "Run as root to allow writing to volume mount") agravando o risco de rodar Chromium + app como root.

A busca (`src/lib/cifraclub-scraper/search.ts`) usa o endpoint Solr público (`solr.sscdn.co`) com JSONP não-oficial — também sem fallback ou cache.

### 3.4 🔴 ALTO — Áudios enviados não sobrevivem a redeploy no Docker

`saveAudioUpload` (`src/lib/api-helpers.ts:63`) grava em `process.cwd()/public/<dir>`. No Dockerfile, apenas `/data` é volume persistente (`DATABASE_PATH=/data/chordset.db`); `public/` **não é copiado para a imagem standalone nem montado como volume**. Todo áudio de referência de músicas/eventos é perdido no próximo deploy. Deve-se gravar em `/data/audio/...` (como já se faz para `drum-samples` via symlink em `Dockerfile:60`).

### 3.5 🟠 ALTO — Migrations ad-hoc e legado confuso

- `initSchema()` em `src/lib/db.ts:18-79` executa `schema.sql` + uma sequência de `ALTER TABLE` inline com `try/catch` que **engole todos os erros** (`catch { /* ignore */ }`). Não há tabela `schema_migrations`, versionamento ou ordem garantida — impossível saber o estado real de um banco antigo.
- O schema real diverge do `data/schema.sql` (ex.: `musicas` no banco tem `bpm`/`volume` concatenados na linha do `updated_at` — evidência de ALTERs ad-hoc fora do arquivo).
- Existe `supabase/migrations/` com sintaxe **PostgreSQL** (`COMMENT ON COLUMN`, `ADD COLUMN IF NOT EXISTS`) — resíduo de uma migração abandonada que contradiz a stack SQLite atual e confunde quem lê o repo. Ou se assume Supabase/Postgres no roadmap, ou se remove.

### 3.6 🟠 ALTO — Ausência total de acessibilidade

Grep no código: **0 ocorrências de `aria-*`, 0 de `role=`** em todo `src/`, apesar de 107 `<button>`. Para um app usado em palco, em telas pequenas e sob baixa luz, faltam: labels em ícones-only (autoscroll, fullscreen, fonte +/-), foco visível, navegação por teclado no drag-and-drop do `SetlistBuilder`, landmarks (`<main>`, `<nav>`), contraste auditado e anúncios de live-region (Toast em `src/components/ui/Toast.tsx`). Sem teste automatizado (axe) no pipeline.

### 3.7 🟠 ALTO — Sem PWA / modo offline

Não existe `manifest.json`, service worker ou estratégia de cache (verificado: `public/` só tem samples de bateria; nenhuma referência a workbox/serwist no código). O caso de uso principal — **setlist ao vivo no palco** — é exatamente onde a rede falha. Hoje, perder conexão durante o evento = perder acesso às cifras. Wake Lock já existe (`PROGRESS.md`), o que mostra que o cenário mobile/palco é real e conhecido.

### 3.8 🟠 MÉDIO — Autenticação single-user e sem CSRF

Basic Auth global (`BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD`): sem multiusuário, sem sessões, sem perfis por músico da banda. Basic Auth via header de navegador não é vulnerável a CSRF clássico, mas a mudança futura para cookies/sessão exigirá proteção CSRF em todas as ~30 API routes mutáveis — hoje nenhuma possui qualquer validação nesse sentido.

### 3.9 🟠 MÉDIO — Validação de entrada inexistente (sem zod/schema)

Nenhuma dependência de validação (sem zod/yup/valibot). Rotas fazem casts diretos (`String(body.query)`, `formData.get('audio') as File`). Casos concretos:

- `src/app/api/ocr/cifra/route.ts` aceita `imageBase64` **sem limite de tamanho** → DoS por payload gigante em memória; repassa `imageUrl` arbitrária a providers externos.
- Upload de áudio (`saveAudioUpload`) valida MIME/extensão mas **não limita tamanho do arquivo**.
- `evento_musicas` aceita `ordem` sem constraint de unicidade por evento (sem `UNIQUE(evento_id, ordem)` no schema).

### 3.10 🟠 MÉDIO — Performance e escala

- `musicasDb.getAll()` sem paginação; `import-song/route.ts:112` faz `getAll().find(...)` — **O(n) em memória** a cada importação, em vez de `SELECT ... WHERE lower(titulo)=? AND lower(artista)=?`.
- Busca com `LIKE '%termo%'` (`musicas-db.ts:141`) faz full scan e não usa os índices existentes; com catálogo grande, FTS5 seria o caminho.
- `<img>` não otimizado (warning de lint) em `musicas/new/page.tsx:439`.
- Rotas GET da API sem `Cache-Control`/ETag.
- Sem `busy_timeout` no SQLite — em concorrência de escrita (WAL ajuda leitura, não escrita-escrita), requisições falham com `SQLITE_BUSY` em vez de aguardar.

### 3.11 🟡 BAIXO — Observabilidade, CI e governança

- **Sem CI**: não há `.github/workflows/` — lint/test/tsc rodam só na máquina do dev.
- **Sem e2e**: Playwright está no projeto, mas apenas como ferramenta de scraping, não de testes.
- Logs via `console.error`; sem logger estruturado (pino), sem rastreamento de erro (Sentry), sem métricas. `/api/health` existe (bom ponto de partida).
- **Sem backup** do SQLite em volume Docker — um único arquivo `chordset.db` concentra todo o acervo (2 músicas, 9 drum patterns, 1 evento hoje — o risco cresce com o uso).
- Dockerfile: instala `git` em produção sem necessidade aparente (`apk add curl git`, linha 50); `--legacy-peer-deps` no `npm ci` sugere conflito de peer deps não resolvido.
- Testes de DB/API inexistentes significam que refactors como o "limpeza geral" (commit `522e637`) não têm rede de segurança.

---

## 4. Roadmap técnico recomendado (priorizado)

### P0 — Integridade e segurança (1–2 semanas)

1. **Ativar FK e sanear dados** — `PRAGMA foreign_keys = ON` em `src/lib/db.ts`; script de auditoria de órfãos em `evento_musicas`/`practice_sessions` antes de ligar.
2. **Fechar o bypass do middleware** — remover a exceção de `/api/cifraclub/` em `src/middleware.ts`; adicionar rate limiting simples (ex.: contador em memória por IP) nas rotas de scraping e OCR.
3. **Persistir áudios em `/data`** — mudar `saveAudioUpload`/`serveAudioFile` para diretório sob o volume (espelhar o padrão do symlink `drum-samples`); script de migração dos arquivos existentes.
4. **Migrations versionadas** — substituir o `initSchema()` ad-hoc por migrations numeradas com tabela `schema_migrations` (ou adotar Drizzle/Kysely). Resolver a ambiguidade `supabase/migrations/` (assumir Postgres no futuro ou deletar).
5. **CI mínimo** — GitHub Actions: `npm run lint` + `npx tsc --noEmit` + `npm test` em PR/push; build do Docker como gate.
6. **Hardening Docker** — rodar como usuário `nextjs` (corrigir permissões do volume em vez de root), remover `git` da imagem final, resolver peer deps sem `--legacy-peer-deps`.
7. **Limites de payload** — teto de tamanho para `imageBase64` e upload de áudio (ex.: 10 MB) + validação com zod nas rotas principais.

### P1 — Experiência de palco (2–4 semanas)

8. **PWA offline-first** — manifest + service worker (Serwist/next-pwa); pré-cache das cifras dos eventos "confirmados"; fallback IndexedDB para setlist do dia; indicador de conectividade na UI. Este é o diferencial triple-A para o caso de uso real.
9. **Cobertura de testes séria** — testes de `*-db.ts` com SQLite em memória; testes de API routes (request/response); componentes críticos (`CifraViewer`, `SetlistBuilder`) com Testing Library; **e2e Playwright** do fluxo "criar evento → montar setlist → modo performance" (o Playwright já está instalado — reusá-lo para testes, não só scraping). Meta: threshold de coverage no CI.
10. **A11y baseline** — rodar axe-core/Lighthouse, adicionar aria-labels aos 107 botões (priorizar controles de palco: autoscroll, transposição, metrônomo), landmarks, foco visível, live-region no `Toast`.
11. **`busy_timeout`** (ex.: 5000 ms) e `synchronous = NORMAL` no SQLite.

### P2 — Robustez do scraping e dados (3–6 semanas)

12. **Reengenharia do scraper** — tentar `fetch` + Cheerio primeiro (a página de cifra é server-rendered; o Chromium pode ser desnecessário), com Playwright apenas como fallback; fila serializada (mutex) + fechamento de páginas; cache de resultados por URL (tabela ou arquivo em `/data`); retry com backoff; alerta quando seletores falharem. Avaliar ToS/fontes alternativas.
13. **Dedup no banco** — substituir o `getAll().find()` por query parametrizada; índice ou constraint parcial para duplicatas.
14. **Busca FTS5** — tabela virtual `musicas_fts` para título/artista/cifra com ranking.
15. **Backup automatizado** — Litestream ou cron de `sqlite3 .backup` para volume/objeto remoto.

### P3 — Multiusuário e plataforma (quando o produto pedir)

16. **Auth real** — Auth.js/NextAuth com SQLite, ou migração para Postgres/Supabase (reaproveitando `supabase/migrations/`); perfis por músico, ownership de eventos, campo `responsavel` virando FK de usuário.
17. **Observabilidade** — logger estruturado (pino), Sentry, métricas de scraping (sucesso/falha/latência), alertas no healthcheck.
18. **Performance frontend** — `next/image`, paginação/infinite scroll nas listagens, cache headers nas GETs, bundle analysis (Tone.js é pesado — carregar sob demanda).
19. **Lighthouse CI** com budgets (performance, a11y ≥ 90) como gate de PR.

---

## 5. Veredito

O ChordSet tem **fundação de código acima da média de projetos pessoais**: typecheck limpo, lint verde, camada de dados organizada, helpers de segurança (path traversal) corretos e deploy containerizado funcional. Porém, há **três riscos críticos que contradizem a ambição triple-A**: foreign keys desligadas (integridade de dados silenciosamente quebrada), rotas de scraping abertas sem auth, e áudios que evaporam a cada redeploy. Somam-se a fragilidade estrutural do scraper Playwright, ausência total de offline/PWA para o caso de uso de palco, zero acessibilidade e cobertura de testes restrita a utilitários. O roadmap P0 é barato (dias) e elimina os riscos existenciais; P1 (offline + testes + a11y) é o que efetivamente separa um app caseiro de um produto triple-A.
