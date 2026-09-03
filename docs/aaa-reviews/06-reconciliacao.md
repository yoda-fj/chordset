# Reconciliação #06 — Consolidação final das revisões (Plano Triple A → v2)

**Data:** 2026-09-03 · **Papel:** Mediador/Reconciliador final
**Insumos:** `PLANO-TRIPLE-A.md` (v1), `04-review-tecnica.md` (B1–B4, I1–I9, M1–M10), `05-review-ux-produto.md` (C1–C10)
**Método:** cada crítica foi validada contra o código real em `src/`, `next.config.js`, `package.json`, `Dockerfile`, `src/middleware.ts`, `src/lib/db.ts`, `src/lib/cifraclub-scraper/cifraclub.ts`, `src/components/chords/*` e `src/app/eventos/[id]/setlist/page.tsx`.

---

## 1. Tabela de emendas consolidadas

### Bloqueantes técnicos (B)

| ID | Crítica original | Validação (evidência no código) | Emenda final para o plano v2 |
|----|------------------|--------------------------------|------------------------------|
| B1 | Serwist/next-pwa com Next 16 é risco não avaliado na fase mais cara | **CONFIRMADA.** `package.json`: `next: ^16.2.3`, script `build: "next build"` (Next 16 usa Turbopack por padrão no build). `next.config.js` é CommonJS mínimo (`serverExternalPackages`, `output: 'standalone'`), sem nenhum plugin de SW. Serwist integra via hook de webpack — sob Turbopack o plugin não roda; `next-pwa` está abandonado. | **Fase 0 ganha tarefa 0.8 (spike "Hello SW", ≤1 dia):** Serwist (ou alternativa) compilando no build de produção, documentando se o build passa a ser `next build --webpack` (impacto no Dockerfile/CI) ou se há caminho Turbopack; SW registrado cacheando 1 rota; teste **dentro do container Docker**. Se o spike falhar → re-planejar 3B antes de executar Fases 1–2. Aceite da Fase 3B passa a exigir "build Docker produz SW funcional". |
| B2 | Gestos conflitam com o scroll vertical da cifra | **CONFIRMADA.** `CifraViewer.tsx:198` tem `touchAction: 'pan-y'` (linha exata citada pelo revisor). Precedente interno: `MusicaCard.tsx:66` já usa `touchAction: 'none'` para drag — ou seja, a tentação de `none` existe e mataria o scroll. | **Tarefa 3.2 reescrita com especificação física:** manter `touch-action: pan-y`; swipe horizontal só com trava de eixo (`axis: 'x'`, threshold >24px de deslocamento horizontal dominante no use-gesture); pinch apenas com 2 toques, sem `preventDefault` do scroll de 1 dedo; `user-select: none` + `-webkit-touch-callout: none` no container do palco (long-press iOS). **Aceite testável:** "scroll vertical de 1 dedo nunca troca de música; swipe com >30° de inclinação nunca troca de música — validado em iOS **e** Android reais". |
| B3 | Estimativas da Fase 3 são ficção (5–8 dias p/ 8 tarefas) | **CONFIRMADA.** `setlist/page.tsx` tem exatamente **398 linhas** e importa `DrumPad` (linha 7) + `AudioRecorderPanel` + hooks de áudio — rewrite é estrutural, não cosmético. | **Fase 3 dividida em 3A (Modo Stage: 3.1–3.5 + acréscimos C5/C9) e 3B (Confiabilidade: PWA offline, e2e, a11y).** Estimativas revisadas na seção 4. Princípio 4 volta a valer. |
| B4 | Saneamento de órfãos sem backup prévio obrigatório | **CONFIRMADA.** `src/lib/db.ts` **não tem** `PRAGMA foreign_keys` (busca retornou zero ocorrências de `foreign_keys`/`busy_timeout`/`synchronous`). Dados = arquivo único `data/chordset.db` (+WAL), sem backup automatizado. | **Tarefa 0.1 alterada:** script nasce com `--dry-run` como padrão e `--apply` explícito; o próprio script faz `sqlite3 .backup`/cópia do arquivo antes de qualquer escrita; testes de cascade para **todas** as FKs (eventos, templates, drum_patterns, practice_sessions — não só música); primeiro run em cópia do banco de produção com relatório anexado ao PROGRESS.md. **E:** export JSON completo (ver I7) vira pré-requisito da 0.1. |

### Importantes técnicos (I)

| ID | Crítica original | Validação | Emenda final para o plano v2 |
|----|------------------|-----------|------------------------------|
| I1 | Fase 1 reestiliza o que Fases 2/3 reescrevem | **CONFIRMADA** (lógica de dependência; ChordViewer/CifraViewer/setlist serão reescritos). | Fase 1 delimitada ao **Backstage** (listas, forms, nav, homepage). Exceção deliberada: o rewrite estrutural do `ChordViewer` sobe para a Fase 1 (ver C7/conflito §2) e já nasce dark-first — o que **elimina** o retrabalho em vez de criá-lo. Aceite da Fase 1 ajustado: "Backstage 100% dark-first; cifra/setlist migram nas Fases 1 (ChordViewer), 2 e 3A". |
| I2 | Fase 0 subestimada; aceite 0.4 improvável; 0.7 quebra deploy | **CONFIRMADA.** Dockerfile: `USER root` (linha 63, com comentário admitindo a razão) e `npm ci --legacy-peer-deps` (linha 12). | (a) Fase 0 reestimada para **5–7 dias**. (b) Aceite 0.4 objetivo: script que compara `PRAGMA table_info`/`index_list` de banco migrado vs. banco fresco, com diff no CI. (c) 0.7 ganha entrypoint com `chown -R nextjs /data` antes de trocar de usuário + teste de **upgrade de deploy no Coolify** (não só build limpo). |
| I3 | Vazamento de páginas do scraper ficou fora de todas as fases | **CONFIRMADA.** `cifraclub.ts:44-46`: `finally { // Don't close browser - keep it for reuse }` — a `Page`/`context` nunca fecha; sem handler de `disconnected`. Bug de produção ativo. | **Fase 0 ganha tarefa 0.9 (hotfix scraper):** `await context.close()`/`page.close()` no `finally`, `browser.on('disconnected')` com re-launch. Reengenharia fetch+Cheerio vira tarefa explícita da Fase 3B (ou sai do plano; não fica só na tabela de riscos). |
| I4 | Offline com duas estratégias redundantes; armadilhas de iOS ignoradas | **CONFIRMADA** (texto do 3.6 manda fazer SW + IndexedDB sem hierarquia). | **3B.1 reescrito:** estratégia primária única — **SW CacheFirst** para GETs de cifra/setlist do evento ativo + indicador "baixado ✓" por música + botão "verificar offline" com status por música. IndexedDB só entra se o spike 0.8 provar o SW insuficiente. Áudio **fora** do pré-cache por padrão (quota). Aceite: "evento aberto online uma vez → modo avião + reload → setlist completo navegável; status de cache visível antes do show" + nota sobre eviction de storage no iOS (re-teste periódico). |
| I5 | WebSocket não existe no output standalone | **CONFIRMADA.** `next.config.js: output: 'standalone'`; `next start`/standalone não suporta WS sem custom server (que jogaria fora o Dockerfile atual). | **Decisão registrada no plano v2:** "WebSocket **descartado** — 4B.2 usa **SSE unidirecional líder→músicos com heartbeat de 15s**; headers `X-Accel-Buffering: no` + timeouts de proxy documentados para Coolify/Traefik; escopo declarado **single-instance** (sem pub/sub)". |
| I6 | Âncora de anotações por índice de linha é frágil | **CONFIRMADA** (schema do 4A propõe `linha/anchor`; 2.1 muda a segmentação de linhas — quebra garantida). | **4A reescrito:** âncora por **conteúdo** (hash da linha + offset de ocorrência + contexto antes/depois, fallback fuzzy); âncora na **letra**, não no acorde (transposição não move anotação). Aceite: "inserir 3 linhas acima → anotação permanece na linha certa ou aparece marcada como órfã visível". |
| I7 | Backup classificado como "quick win" — é fundação | **CONFIRMADA** (banco único em volume Docker; Fases 0–1 rodam scripts destrutivos). | **Export/import JSON completo promovido à Fase 0 (tarefa 0.10, pré-requisito de 0.1/0.4):** export manual testado com restore verificado em banco limpo. Litestream/cron fica para depois. Sai da 4C. |
| I8 | Tone.js inteiro no bundle da tela mais crítica | **CONFIRMADA.** `import * as Tone from 'tone'` em **5 arquivos** (`DrumPad.tsx:4`, `Metronome.tsx:4`, `musicas/[id]/page.tsx:6`, `ritmos/page.tsx:6`, `ritmos/[id]/page.tsx:7`); `setlist/page.tsx:7` importa `DrumPad` → Tone inteiro no bundle do palco. | **Fase 2 ganha tarefa 2.7:** `next/dynamic` (ssr:false) para DrumPad/Metronome na página de setlist + `Tone.start()` disparado por gesto do usuário. Aceite: First Load JS da rota de setlist medido antes/depois e registrado no PROGRESS. |
| I9 | Pedal/teclado sem gerenciamento de foco; fullscreen "automático" impossível | **CONFIRMADA** (comportamento de browser: espaço ativa botão focado; fullscreen/Wake Lock exigem gesto). | **3.3/3.1 especificados:** hotkeys no `window` com `preventDefault` + `ignoreEventWhen(target é input/textarea/select)`; fullscreen e Wake Lock disparados no **primeiro toque** (não no load), com re-aquisição de Wake Lock em `visibilitychange`; aceite validado com pedal real ou simulador HID (modelo documentado). |

### Menores técnicos (M)

| ID | Crítica | Validação | Emenda final |
|----|---------|-----------|--------------|
| M1 | Aceite "1,5m no escuro" não é testável | Confirmada | Fase 2: aceite vira "px mínimos (20px) + contraste ≥7:1 via axe + checklist manual no PROGRESS". |
| M2 | Lighthouse ≥85 fraco; axe só na Fase 3 | Confirmada | **axe-core sobe para a Fase 1** (converge com C2/C6 — decisão de meta em §2). |
| M3 | Rate limit por IP atrás de proxy | Confirmada | 0.2: ler `x-forwarded-for` com política de confiança documentada. |
| M4 | Build Docker como gate de todo PR | Confirmada | Gate de PR = lint+tsc+test; build Docker só em merge na main/nightly. |
| M5 | `--legacy-peer-deps` pode exigir troca de lib | Confirmada (`lucide-react: ^1.24.0` — versão fora da série pública 0.x, suspeita) | 0.7 aceite revisado: "`npm ci` limpo **ou** decisão documentada com causa identificada". |
| M6 | `url.includes('.')` é bypass de auth largo | **Confirmada** (`middleware.ts:16`) | 0.2 inclui: trocar por allowlist explícita de extensões estáticas. |
| M7 | Aceite "sem SQLITE_BUSY" sem teste | Confirmada | 0.5: teste com 2 escritas simultâneas provocando contenção. |
| M8 | UNIQUE(evento_id,ordem) e dedup O(n) fora do plano | Confirmada | Ambos entram na 0.4/0.5 (~1h cada). |
| M9 | 4B.1 exigirá novo bypass no middleware recém-fechado | Confirmada | Especificar já: bypass só para `/eventos/compartilhado/[token]` com validação de token, revogação e rate limit. |
| M10 | Warnings de lint contam como gate? | Confirmada | Definir no plano: **warnings contam** (`eslint --max-warnings 0`) a partir da Fase 0. |

### Críticas de UX/Produto (C)

| ID | Crítica | Validação | Emenda final |
|----|---------|-----------|--------------|
| C1 | Motion/micro-interações sem dono nem fase | **CONFIRMADA** (plano só tem `layoutId` e `AnimatePresence`; `Skeleton` é criado em 1.4 sem tarefa que o use). | **Fase 1 ganha tarefa 1.8 "Motion system":** springs globais, stagger de listas, `whileTap` em botões/cards, **skeletons em todas as páginas de lista** (substituindo `Loader2`/"Carregando..."), `prefers-reduced-motion` global (movido da 3.8). Aceite Fase 1: "zero spinner; toda lista tem skeleton; animações desligam com reduced-motion". |
| C2 | Aceites medem funcionalidade, não experiência | **CONFIRMADA.** | Aceites perceptíveis por fase: Fase 1 → "abre já em escuro sem flash claro em cold start (FOUC de tema testado)"; Fase 3A → "troca de música por swipe/pedal < 300ms percebidos, sem repaint branco", "chrome some em 3s e reaparece em 1 toque (device real)", "tela entre-músicas em 100% das transições". Os não-automatizáveis viram checklist manual registrado (converge com M1). |
| C3 | Empty states/erros globais fora do plano | **CONFIRMADA** (1.7 cobre só homepage). | **Fase 1 ganha tarefa 1.9:** padrão único de empty state (ícone + título + CTA primário + secundário) nas 4 seções (Músicas/Eventos/Ensaios/Ritmos) + estado de erro com retry + erro de rede calmo no Stage. |
| C4 | 4B.2 monolítico; Fase 4 sem aceites | **CONFIRMADA** (converge com I5). | **4B.2 decomposto:** 4B.2a — sessão ao vivo (só índice da música, SSE; aceite: 2 devices sincronizam < 1s); 4B.2b — tom por instrumento/membro (aceite: membro em Bb vê transposto sem afetar líder). Aceites adicionados: 4A.1 ("anotação persiste por música e por evento; visível no Stage sem poluir leitura") e 4B.1 ("link abre sem login; revogação < 1min"). |
| C5 | Count-in sumiu; Stage não cita tablet/desktop | **CONFIRMADA** (3.4 não tem count-in; nenhuma fase cita viewports). | 3.4 ganha "count-in opcional (4 tempos, configurável por evento)" — sinérgico com o `Tone.start()` por gesto do I8. Aceite Fase 3A: "verificado em 3 viewports: celular, tablet 10\" (pedestal), desktop; nenhuma ação primária exige sidebar/overlay". |
| C6 | Meta a11y contradiz princípio WCAG AAA | **AJUSTADA** (conflita com M2 sobre o número — ver §2). | Meta escalonada: **Lighthouse a11y ≥ 90 na Fase 1** (Backstage) e **≥ 95 nas telas reescritas** (Fases 2/3A), **+ contraste dos pares texto/fundo do Stage ≥ 7:1** listado explicitamente no PR (AAA real onde importa). |
| C7 | Bug do ChordViewer deveria subir para a Fase 1 | **CONFIRMADA.** `ChordViewer.tsx:327`: `const CHAR_WIDTH = 8.5` fixo; acordes posicionados por `displayPosition * CHAR_WIDTH` — desalinhamento estrutural real. | **2.1 promovido a tarefa 1.0 da Fase 1** (rewrite acorde/sílaba empilhado + testes com fixtures reais), já nascendo dark-first (resolve o conflito com I1 — ver §2). Fase 2 mantém escala tipográfica/stepper/metrônomo. |
| C8 | Onboarding em 4C está certo; não confundir com empty states | **CONFIRMADA** (concordância, não crítica). | Nenhuma mudança de posição. Garantido: C3 (fundação) na Fase 1; onboarding demo permanece na 4C. |
| C9 | Teleprompter é confiabilidade de palco, não quick win | **AJUSTADA.** | Versão **mínima** entra na 3A como 3A.6: "duração estimada por BPM × linhas + marcadores de seção clicáveis". Versão calibrada completa permanece na 4C. Gesto "dois dedos pausa autoscroll" restaurado no 3.2 (com a mesma disciplina de eixos do B2). |
| C10 | cmdk órfã; diagramas/capo sem decisão registrada | **CONFIRMADA** (cmdk nas deps da Fase 1, feature só na 4C). | (a) **`cmdk` removido das deps da Fase 1** — a Fase 1 já cresceu com 1.0/1.8/1.9; palette volta para a 4C com sua dep. (b) Seção 8 ganha: "❌ Diagramas de acordes/capo agora — dependem de ChordPro nativo; fora do foco 'o que já existe'". |

---

## 2. Conflitos entre revisores e decisões mediadas

### Conflito 1 — C7 (UX: subir bug do ChordViewer para Fase 1) × I1 (Tech: Fase 1 só Backstage, sem tocar em cifra)
- **C7** quer o defeito visual nº 1 corrigido antes do "salto triple A"; **I1** teme pagar retrofit visual em componente que será reescrito.
- **Decisão: C7 vence, e I1 é preservada pela forma da execução.** A tarefa 2.1 é um **rewrite estrutural** (render acorde/sílaba empilhado), não um restyle — portanto não é o retrabalho que I1 teme: o componente reescrito já nasce dark-first com os tokens da Fase 1. O que I1 proíbe continua proibido: nenhum retrofit visual no `CifraViewer` atual nem na página de setlist (esses migram nas Fases 2/3A). Evidência: `ChordViewer.tsx:327` confirma que o bug é de arquitetura de render, não de CSS.

### Conflito 2 — C6 (UX: Lighthouse a11y ≥ 95) × M2 (Tech: ≥ 90 basta, app pequeno)
- **Decisão: meta escalonada.** ≥ 90 na Fase 1 (Backstage, app inteiro ainda em migração) e ≥ 95 nas telas reescritas a partir da Fase 2/3A. O que não se negocia é o princípio AAA **no palco**: contraste ≥ 7:1 dos pares texto/fundo do modo Stage validado e listado no PR (pedido de C6 mantido integralmente). axe-core sobe para a Fase 1 (consenso C2/M2).

### Conflito 3 — C9 (UX: teleprompter sobe para a Fase 3) × B3 (Tech: Fase 3 já estourada)
- **Decisão: entra só a versão mínima, na 3A recém-criada.** A divisão 3A/3B (B3) cria o espaço; o teleprompter entra como 3A.6 em versão mínima (BPM × linhas + marcadores clicáveis), sem a calibração completa, que fica na 4C. Custo marginal baixo porque se apoia no autoscroll (3.5).

### Conflito 4 (latente) — C2/C5 (mais aceites perceptíveis e features de palco) × I2/B3 (estimativas já estouram)
- **Decisão: aceites perceptíveis entram, features não inflam.** Todos os acréscimos de UX na Fase 3A são especificações de comportamento de itens já existentes (count-in no 3.4, viewports no aceite) ou versões mínimas (3A.6). Nenhuma feature nova entra nas Fases 0–3 além das listadas.

### Sem conflito — convergências registradas
- I5 (SSE, não WebSocket) e C4 (decompor 4B.2): mesma decisão, adotada integralmente.
- I7 e B4: backup/export como fundação — consenso tácito com o revisor UX (que não contestou).
- M2 e C2: axe na Fase 1 — consenso.

---

## 3. Decisões sobre as 4 perguntas estruturais do v2

| Pergunta | Decisão | Justificativa |
|----------|---------|---------------|
| **Subir bug do ChordViewer para a Fase 1?** | **SIM** — vira tarefa **1.0**, primeira da fase. | C7 confirmada (`CHAR_WIDTH=8.5`, `ChordViewer.tsx:327`); princípio "corrigir antes de construir" estendido ao defeito visual nº 1; rewrite já nasce dark-first, sem retrabalho (mediação com I1). |
| **Dividir a Fase 3 em 3A/3B?** | **SIM** — 3A = Modo Stage (3.1–3.5 + count-in + teleprompter mínimo), 3B = Confiabilidade (PWA offline, e2e, axe, reengenharia do scraper). | B3 confirmada (setlist de 398 linhas + 8 tarefas pesadas não cabem em 5–8 dias); restaura o princípio 4. |
| **Spike de SW na Fase 0?** | **SIM** — tarefa **0.8**, ≤1 dia, com teste dentro do container Docker. | B1 confirmada (Next 16.2.3 + `next build` sem flag + config CJS sem plugin; Turbopack é o build padrão do Next 16 e o plugin webpack do Serwist não roda nele). Aceite da 3B depende do resultado. |
| **Backup obrigatório antes do saneamento?** | **SIM, dupla camada** — (a) export/import JSON completo com restore testado (tarefa **0.10**, pré-requisito de 0.1/0.4, promovido da 4C); (b) o script de saneamento nasce com `--dry-run` padrão, `--apply` explícito e **cópia automática do arquivo** antes de escrever. | B4 + I7 confirmadas (banco = arquivo único `data/chordset.db`, sem backup; as Fases 0–1 são exatamente a janela de risco). |

### Nova estrutura de fases do v2

- **Fase 0 — Fundação crítica (5–7 dias):** 0.1 FK ON + saneamento (com dry-run/backup) · 0.2 auth/rate-limit/allowlist de extensões (inclui M3, M6) · 0.3 áudio em `/data/audio/` · 0.4 migrations versionadas (+ UNIQUE evento_id/ordem — M8) · 0.5 busy_timeout/zod/limites (+ dedup import-song — M8) · 0.6 CI (gate PR = lint+tsc+test; Docker na main — M4) · 0.7 hardening Docker (+ chown no entrypoint, teste de upgrade — I2, M5) · **0.8 spike PWA "Hello SW" (novo — B1)** · **0.9 hotfix vazamento do scraper (novo — I3)** · **0.10 export/import JSON com restore testado (promovido — I7)**.
- **Fase 1 — Design System + coração visual (5–7 dias):** **1.0 rewrite ChordViewer acorde/sílaba (promovido — C7)** · 1.1 tokens · 1.2 dark-first **Backstage** (escopo delimitado — I1) · 1.3 fontes · 1.4 componentes UI (sem `cmdk` — C10) · 1.5 branding · 1.6 shell nav · 1.7 homepage viva · **1.8 motion system + skeletons (novo — C1)** · **1.9 empty states/erros globais (novo — C3)** · axe-core no CI (M2/C2).
- **Fase 2 — A Cifra (3–4 dias):** 2.2 escala tipográfica · 2.3 stepper de tom · 2.4 metrônomo visual · 2.5 alvos de toque/aria · 2.6 testes · **2.7 lazy-load Tone.js (novo — I8)**. (2.1 saiu para a 1.0.)
- **Fase 3A — Modo Stage (6–8 dias):** 3.1 rewrite setlist/Stage (fullscreen/Wake Lock no 1º toque — I9) · 3.2 gestos com trava de eixo (spec B2; dois dedos pausa autoscroll — C9) · 3.3 pedal/hotkeys com gestão de foco (I9) · 3.4 botão próxima + tela entre-músicas **+ count-in opcional (C5)** · 3.5 barra de progresso · **3A.6 teleprompter mínimo: BPM×linhas + marcadores de seção (C9)**.
- **Fase 3B — Confiabilidade no palco (5–7 dias):** 3B.1 PWA offline SW-CacheFirst único + indicador por música (I4; depende do spike 0.8) · 3B.2 e2e Playwright · 3B.3 a11y baseline restante · **3B.4 reengenharia fetch+Cheerio do scraper (I3)**.
- **Fase 4 — Features queridas:** 4A.1 anotações com **âncora por conteúdo** (I6) + aceite · 4A.2 manuscrito · 4B.1 link público com bypass especificado (M9) + aceite · 4B.2a sessão ao vivo **SSE** (I5) + aceite · 4B.2b tom por membro + aceite (C4) · 4C quick wins (sem export JSON, que subiu; com teleprompter calibrado completo, onboarding, palette ⌘K + `cmdk`).
- **Seção 8 (NÃO fazer)** ganha: ❌ WebSocket (SSE decidido — I5) · ❌ escrita offline · ❌ diagramas de acordes/capo agora (C10).

---

## 4. Estimativas realistas revisadas

| Fase | v1 | v2 (revisada) | Motivo da revisão |
|------|----|---------------|-------------------|
| 0 — Fundação | 2–4 dias | **5–7 dias** | I2 (7 tarefas originais já eram 4–6) + 3 tarefas novas (0.8 spike, 0.9 scraper, 0.10 backup) |
| 1 — Design + ChordViewer | 3–5 dias | **5–7 dias** | Entraram 1.0 (rewrite com testes — C7), 1.8 (motion — C1), 1.9 (empty states — C3); escopo visual delimitado ao Backstage compensa parcialmente (I1) |
| 2 — Cifra | 3–5 dias | **3–4 dias** | Saiu o rewrite 2.1 (foi para 1.0); entrou 2.7 lazy Tone (I8) |
| 3A — Modo Stage | (parte de 5–8) | **6–8 dias** | B3: rewrite de página de 398 linhas + gestos (B2) + pedal (I9) + count-in/teleprompter mínimo (C5/C9) |
| 3B — Confiabilidade | (parte de 5–8) | **5–7 dias** | B3: PWA offline (pós-spike), e2e do zero, axe, reengenharia do scraper (I3) |
| 4A — Anotações | sem estimativa | **4–6 dias** (4A.1) | Âncora por conteúdo é mais cara que por linha (I6) |
| 4B.1 — Links públicos | sem estimativa | **2–3 dias** | Bypass de middleware especificado (M9) reduz incerteza |
| 4B.2a/2b — Palco Conectado | sem estimativa | **4–6 dias** (2a) / sob demanda (2b) | SSE simplifica (I5); decomposição C4 |
| **Total Fases 0–3B** | 13–22 dias | **19–29 dias** | Aumento honesto: o v1 subestimava as duas fases mais caras (B3, I2) |

---

## Veredito da reconciliação

**Plano v1 → v2: APROVADO PARA EXECUÇÃO após reescrita incorporando esta tabela.** Nenhuma crítica foi descartada integralmente: 21 confirmadas, 2 ajustadas (C6, C9), 1 concordância sem ação (C8). As duas maiores incógnitas técnicas (PWA/Turbopack, gestos×scroll) viram tarefas com aceite escrito **antes** do trabalho caro; a janela de risco de perda de dados (Fases 0–1) ganha dupla proteção de backup; e o "triple A" perceptível (motion, empty states, aceites de experiência) entra com dono e fase.
