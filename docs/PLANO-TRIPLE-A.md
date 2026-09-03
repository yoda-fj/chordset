# ChordSet — Plano Triple A (v2 — FINAL, reconciliado)

**Data:** 2026-09-03 · **Status:** aprovado para execução por 3 revisores (técnica, UX/produto, mediador)
**Fontes:** `aaa-reviews/01-ux-audit.md` · `02-tech-audit.md` · `03-product-proposals.md` · `04-review-tecnica.md` · `05-review-ux-produto.md` · `06-reconciliacao.md`
**Direção do dono:** foco primeiro no que já existe; prioridades na ordem **visual/design → confiabilidade no palco → features novas**; features dos sonhos: **anotar na cifra** e **compartilhar setlist com a banda** (em fases).
**Changelog v1→v2:** 23 críticas processadas — 21 confirmadas, 2 ajustadas, 0 descartadas. Ver `06-reconciliacao.md`.

---

## 1. Visão

Transformar o ChordSet de "ferramenta funcional" em **instrumento de palco**, com dois modos de vida:

- **Backstage** (gerenciar músicas, eventos, ensaios): denso, eficiente, bonito.
- **Stage** (executar setlist ao vivo): escuro OLED, tipografia gigante, gestual, à prova de erro, offline.

## 2. Princípios

1. **Dark-first.** Palco é escuro: preto OLED, âmbar #FFB020, contraste do Stage **≥ 7:1 (WCAG AAA)** inegociável. Tema claro = exceção para admin/impressão.
2. **Nada quebra no palco.** Offline, alvos de toque ≥48px, pedal Bluetooth, zero `confirm()` nativo.
3. **Corrigir antes de construir** — inclusive o defeito visual nº 1 (ChordViewer desalinhado).
4. **Fases curtas e entregáveis**, cada uma com aceite objetivo + aceites **perceptíveis** de experiência.
5. **Qualidade contínua:** `npm run lint -- --max-warnings 0` + `npx tsc --noEmit` + `npm test` verdes a cada commit; CI como gate. **Warnings contam.**

## 3. Estimativas (revisadas e realistas)

| Fase | Estimativa | Conteúdo |
|------|-----------|----------|
| 0 — Fundação crítica | **5–7 dias** | 10 tarefas (incl. spike PWA, hotfix scraper, backup) |
| 1 — Design System + coração visual | **5–7 dias** | rewrite ChordViewer + design system Backstage |
| 2 — A Cifra | **3–4 dias** | tipografia de palco, stepper de tom, metrônomo visual, lazy Tone |
| 3A — Modo Stage | **6–8 dias** | rewrite setlist, gestos, pedal, entre-músicas, teleprompter mínimo |
| 3B — Confiabilidade | **5–7 dias** | PWA offline, e2e, a11y, reengenharia scraper |
| **Total 0–3B** | **19–29 dias** | |
| 4A.1 — Anotações (texto/highlights) | 4–6 dias | sob demanda |
| 4B.1 — Links públicos de setlist | 2–3 dias | sob demanda |
| 4B.2a — Palco Conectado (SSE) | 4–6 dias | sob demanda |

---

## 4. Fase 0 — Fundação crítica (5–7 dias) 🔴

> Elimina os riscos existenciais. Nada visual aqui — mas nada avança sem isto.

| # | Tarefa | Aceite |
|---|--------|--------|
| 0.1 | **FK ON + saneamento de órfãos.** `PRAGMA foreign_keys = ON` em `src/lib/db.ts`; script `scripts/sanitize-orphans.ts` com **`--dry-run` padrão, `--apply` explícito e cópia automática do arquivo .db antes de escrever**; testes de cascade para TODAS as FKs (eventos, templates, drum_patterns, practice_sessions). **Pré-requisito: 0.10 concluído.** Primeiro run em cópia do banco de produção, relatório no PROGRESS.md | `PRAGMA foreign_keys` = 1; relatório de órfãos anexado; cascade testado |
| 0.2 | **Fechar bypass de auth** em `/api/cifraclub/*` (`middleware.ts:7-9`); trocar o bypass largo `url.includes('.')` (linha 16) por **allowlist explícita de extensões estáticas**; rate limit por IP (memória) lendo `x-forwarded-for` com política de confiança documentada, nas rotas de scraping/OCR | Sem auth → 401; >20 req/min → 429; assets estáticos continuam públicos |
| 0.3 | **Áudios no volume `/data/audio/`** (`saveAudioUpload`/`serveAudioFile` em `src/lib/api-helpers.ts`), padrão do symlink drum-samples + migração dos existentes | Upload + redeploy Docker → áudio sobrevive |
| 0.4 | **Migrations versionadas:** tabela `schema_migrations`, scripts numerados; resolver `supabase/migrations/` (arquivar/remover); incluir `UNIQUE(evento_id, ordem)` | Script compara `PRAGMA table_info`/`index_list` de banco migrado vs. fresco — diff vazio no CI |
| 0.5 | `busy_timeout=5000` + `synchronous=NORMAL`; zod + limite 10MB em OCR/upload; dedup de import-song via query parametrizada (fim do `getAll().find()` O(n)) | Payload gigante → 413; teste com 2 escritas simultâneas sem `SQLITE_BUSY` |
| 0.6 | **CI** (GitHub Actions): gate de PR = lint (`--max-warnings 0`) + tsc + test; build Docker só em merge na main/nightly | PR quebrado não mergeia |
| 0.7 | **Hardening Docker:** usuário `nextjs` com entrypoint `chown -R nextjs /data` antes de trocar de usuário; remover `git` da imagem; `npm ci` limpo **ou** causa do `--legacy-peer-deps` identificada e documentada (suspeita: `lucide-react@^1.24.0`) | Container não-roo; **teste de upgrade de deploy no Coolify** (não só build limpo) |
| 0.8 | **🆕 Spike PWA "Hello SW" (≤1 dia).** Serwist (ou alternativa) compilando no build de produção com Next 16/Turbopack; documentar se precisa `next build --webpack` (impacto em Dockerfile/CI); SW cacheando 1 rota; **testado dentro do container Docker**. Se falhar → re-planejar 3B ANTES das Fases 1–2 | Decisão escrita no PROGRESS: caminho de SW confirmado ou plano B |
| 0.9 | **🆕 Hotfix scraper** (`cifraclub.ts:44`): `await context.close()`/`page.close()` no `finally`; `browser.on('disconnected')` com re-launch | Sem vazamento de páginas em imports seguidos |
| 0.10 | **🆕 Backup: export/import JSON completo** com **restore testado em banco limpo**. Pré-requisito de 0.1 e 0.4 | Export → wipe → import → dados idênticos |

---

## 5. Fase 1 — Design System + coração visual (5–7 dias) 🎨

> Escopo delimitado ao **Backstage** + rewrite do ChordViewer. Sem retrofit visual no CifraViewer/setlist atuais (migram nas Fases 2/3A).

| # | Tarefa | Detalhes |
|---|--------|----------|
| 1.0 | **🆕 REWRITE DO CHORDVIEWER** (promovido da 2.1 — defeito visual nº 1): render **acorde/sílaba empilhado** (spans inline, padrão ChordSheetJS) substituindo `CHAR_WIDTH=8.5` fixo (`ChordViewer.tsx:327`); já nasce **dark-first** com os tokens; TDD com fixtures de cifras reais | Zoom 20→64px nunca desalinha; testes verdes |
| 1.1 | **Tokens no Tailwind** (config hoje vazio): `surface/ink/brand(âmbar #FFB020)/chord(#34D399)/section(#A78BFA)/danger/success` via CSS vars; radii, sombras, easing spring | — |
| 1.2 | **Dark-first Backstage:** `darkMode:'class'` + `next-themes`; default `zinc-950`; eliminar `dark:` órfãs; **zero FOUC claro no cold start** | — |
| 1.3 | **Fontes** via `next/font`: Space Grotesk (display), Instrument Sans (UI), JetBrains Mono (cifras) | — |
| 1.4 | **Componentes UI** (CVA + tailwind-merge + Radix): Button (size `stage`), Badge, Card, Input, Select, Dialog (substitui TODOS os `confirm()/alert()`), Sheet/vaul, Skeleton, SegmentedControl, Tabs; Toast → `sonner`. **`cmdk` NÃO entra nesta fase** | — |
| 1.5 | **Branding:** "ChordSet" em metadata/logo/título (hoje "Setlist Tools"); favicon + ícones + `manifest.webmanifest` | — |
| 1.6 | **Shell:** bottom tab bar mobile com pill animada (`layoutId`); navbar desktop com rota ativa; landmarks `<main>/<nav>` | — |
| 1.7 | **Homepage viva:** "▶ Começar show de hoje", cards de continuidade, empty states com CTA | — |
| 1.8 | **🆕 Motion system:** springs globais, stagger de listas, `whileTap` em botões/cards, **skeletons em TODAS as listas** (fim dos `Loader2`/"Carregando..."), `prefers-reduced-motion` global | Zero spinner no app |
| 1.9 | **🆕 Empty states/erros globais:** padrão único (ícone + título + CTA primário + secundário) nas 4 seções + erro com retry + erro de rede calmo | — |

**Deps:** `framer-motion next-themes class-variance-authority tailwind-merge clsx sonner @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-slider vaul`

**Aceites da fase:** Backstage 100% dark-first sem flash claro; zero cor hardcoded; zero `confirm()`; zero spinner; **Lighthouse a11y ≥ 90 + axe-core no CI**; ChordViewer reescrito com testes.

---

## 6. Fase 2 — A Cifra (3–4 dias) 🎼

| # | Tarefa | Aceite |
|---|--------|--------|
| 2.2 | **Escala tipográfica de palco:** mín 20px, default 24–28px, teto 64px; acordes peso 700 cor `chord` | Mínimos em px + contraste ≥7:1 via axe + checklist manual no PROGRESS |
| 2.3 | **Stepper de tom gigante** (`− [ G ] +` ≥64px, flip animado) no lugar do `<select>` | Troca de tom com 1 dedo |
| 2.4 | **Metrônomo visual:** flash sincronizado ao `Tone.Transport` + tap-tempo | Pulso visível sem áudio |
| 2.5 | **Alvos de toque ≥48px** + `aria-label` em todos os botões de ícone (107 hoje sem) | axe limpo nos controles de cifra |
| 2.6 | **Testes de componente** (Testing Library) para ChordViewer/CifraViewer | Alinhamento, transposição, zoom cobertos |
| 2.7 | **🆕 Lazy-load Tone.js** (`next/dynamic`, ssr:false) para DrumPad/Metronome na setlist; `Tone.start()` por gesto do usuário | First Load JS da rota setlist medido antes/depois no PROGRESS |

---

## 7. Fase 3A — Modo Stage (6–8 dias) 🎤

| # | Tarefa | Aceite |
|---|--------|--------|
| 3.1 | **Rewrite `setlist/page.tsx` (398 linhas) como Modo Stage:** chrome auto-hide 3s (`AnimatePresence`), reaparece em 1 toque; fullscreen + Wake Lock disparados no **primeiro toque** (não no load — browsers exigem gesto); re-aquisição de Wake Lock em `visibilitychange`; título em `stage-lg` + "3/12 · próxima: X" | Chrome some em 3s e reaparece em 1 toque — **device real** |
| 3.2 | **Gestos com trava de eixo** (`@use-gesture/react`): manter `touch-action: pan-y`; swipe horizontal só com deslocamento dominante >24px (`axis:'x'`); **swipe >30° de inclinação NUNCA troca de música**; pinch com 2 toques sem matar scroll de 1 dedo; `user-select:none` + `-webkit-touch-callout:none` (long-press iOS); dois dedos pausa autoscroll | Scroll vertical de 1 dedo nunca troca música — **validado em iOS E Android reais** |
| 3.3 | **Pedal Bluetooth/teclado** (`react-hotkeys-hook`): listener no `window` com `preventDefault` + ignorar quando target é input/textarea/select (espaço não ativa botão focado); →/↓/←/↑/espaço/F/+/- | Show completo só com pedal — validado com pedal real ou simulador HID (modelo documentado) |
| 3.4 | **Botão "Próxima música ▶"** flutuante (72px, âmbar, haptic) + **tela entre-músicas** (cartão gigante: título/tom/BPM) + **count-in opcional de 4 tempos** configurável por evento | Tela entre-músicas em 100% das transições |
| 3.5 | **Barra de progresso** da música no topo (ligada ao autoscroll) | — |
| 3A.6 | **🆕 Teleprompter mínimo:** duração estimada por BPM × nº de linhas + marcadores de seção clicáveis | Seção clicável posiciona o scroll |

**Aceites da fase:** troca de música por swipe/pedal **<300ms percebidos, sem repaint branco**; verificado em **3 viewports** (celular, tablet 10" pedestal, desktop); nenhuma ação primária exige sidebar/overlay; contraste Stage ≥7:1 listado no PR; **Lighthouse a11y ≥ 95 nas telas reescritas**.

---

## 8. Fase 3B — Confiabilidade no palco (5–7 dias) 🛡️

| # | Tarefa | Aceite |
|---|--------|--------|
| 3B.1 | **PWA offline — estratégia única SW CacheFirst** (depende do spike 0.8) para GETs de cifra/setlist do evento ativo + indicador "baixado ✓" por música + botão "verificar offline"; **áudio fora do pré-cache** (quota iOS); IndexedDB só se o spike provar SW insuficiente; nota sobre eviction iOS com re-teste periódico | Evento aberto online 1× → modo avião + reload → setlist completo navegável; status de cache visível antes do show; **build Docker produz SW funcional** |
| 3B.2 | **e2e Playwright** (reusar o já instalado): criar evento → montar setlist → modo performance; testes de API routes e `*-db.ts` com SQLite em memória | e2e verde no CI |
| 3B.3 | **A11y baseline restante:** landmarks, `focus-visible`, live-region em toasts, auditoria final | axe limpo global |
| 3B.4 | **🆕 Reengenharia do scraper:** fetch+Cheerio primeiro (página é server-rendered), Playwright como fallback; fila com mutex; cache por URL; retry com backoff | Import sem Chromium no caminho feliz |

---

## 9. Fase 4 — Features queridas ⭐

### 4A — Anotar na cifra (favorita #1)
- **4A.1:** notas de texto + highlights com **âncora por conteúdo** (hash da linha + offset de ocorrência + contexto antes/depois, fallback fuzzy) — âncora na **letra**, nunca no acorde (transposição não move anotação). Tabela `annotations` (musica_id, evento_id nullable, anchor, tipo, payload JSON). **Aceite:** inserir 3 linhas acima → anotação permanece na linha certa ou aparece como órfã visível; persiste por música e por evento; visível no Stage sem poluir a leitura
- **4A.2 (depois):** manuscritas (canvas/stylus)

### 4B — Compartilhar setlist com a banda (favorita #2)
- **4B.1 (2–3d):** link público read-only por evento (token UUID); **bypass de middleware especificado já:** só `/eventos/compartilhado/[token]`, com validação de token, revogação e rate limit. **Aceite:** abre sem login; revogação efetiva < 1min
- **4B.2a (4–6d):** "Palco Conectado" via **SSE unidirecional líder→músicos, heartbeat 15s** (WebSocket **descartado** — incompatível com output standalone); headers `X-Accel-Buffering: no` + timeouts de proxy documentados para Coolify/Traefik; escopo **single-instance**. **Aceite:** 2 devices sincronizam < 1s
- **4B.2b:** tom por instrumento/membro (sax em Bb vê transposto sem afetar o líder)

### 4C — Quick wins (encaixar conforme energia)
Teleprompter calibrado completo · export PDF de música/setlist · player de referência (YouTube/Spotify embed) · onboarding demo (5 músicas + setlist exemplo) · command palette ⌘K (+`cmdk`) · stats de ensaio v2

## 10. O que NÃO fazer agora

- ❌ Rede social/feed · ❌ editor de partituras · ❌ app nativo (PWA primeiro) · ❌ catálogo próprio sem licenciamento
- ❌ **WebSocket** (SSE decidido — standalone não suporta) · ❌ **escrita offline** (read-only primeiro)
- ❌ **Diagramas de acordes/capo agora** — dependem de ChordPro nativo; fora do foco "o que já existe"
- ❌ SaaS multi-tenant antes da hora · ❌ remover Basic Auth — convive com links por token

## 11. Governança de execução

- Execução por **subagentes** (um por tarefa) com **revisão em dois estágios** (spec → qualidade).
- Commit por tarefa; PROGRESS.md atualizado ao fim de cada fase (inclui relatórios de órfãos, decisão do spike SW, métricas de bundle).
- Gate contínuo: `lint --max-warnings 0` + `tsc` + `test` (+ e2e a partir da 3B).
- Aceites não-automatizáveis viram **checklist manual registrado** no PROGRESS.

---

## Revisões de agentes ✅

- [x] Revisor técnico (cético) — `04-review-tecnica.md` — aprovado com mudanças (4 bloqueantes + 9 importantes + 10 menores)
- [x] Revisor UX/produto — `05-review-ux-produto.md` — aprovado com mudanças (C1–C10)
- [x] Mediador/reconciliador — `06-reconciliacao.md` — **21 confirmadas, 2 ajustadas, 0 descartadas → APROVADO PARA EXECUÇÃO como v2**
