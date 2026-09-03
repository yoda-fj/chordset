# Revisão Técnica #04 — Plano Triple A (revisor cético)

**Data:** 2026-09-03 · **Revisor:** Arquitetura/Risco (Revisor A)
**Método:** leitura crítica do `PLANO-TRIPLE-A.md` cruzada com as auditorias 01–03 e **verificação direta no código** (`package.json`, `Dockerfile`, `next.config.js`, `src/middleware.ts`, `src/lib/db.ts`, `src/lib/api-helpers.ts`, `src/components/chords/*`, `src/app/eventos/[id]/setlist/page.tsx`).

O plano está direcionalmente correto (fases na ordem certa, prioridades batem com as auditorias). Meu trabalho aqui é impedir que ele vá para execução com furos. Seguem as críticas, da mais grave à menor.

---

## BLOQUEANTES

### B1 — [SEVERIDADE: bloqueante] Serwist/PWA com Next 16 é um risco não avaliado, jogado para a fase mais cara

**Problema:** A tarefa 3.6 assume "Serwist/next-pwa" como detalhe de implementação. Não é. (a) `next-pwa` está abandonado e quebra com App Router; (b) Serwist se integra via **plugin de webpack** (`@serwist/next`), e o **Next 16 usa Turbopack por padrão no build** — ou seja, o plugin pode simplesmente não rodar no `next build` atual, exigindo pinar `next build --webpack` (mais lento, e precisa ser refletido no Dockerfile/CI) ou esperar suporte a Turbopack; (c) o `next.config.js` atual é CommonJS mínimo (`serverExternalPackages`, `output: 'standalone'`) e nunca foi testado com SW. Descobrir isso na Fase 3 — depois de reescrever o setlist — transforma a tarefa mais arriscada do plano em surpresa de última hora. O "Aceite da fase" ("modo avião → setlist abre") depende inteiramente disso.
**Correção:** criar na **Fase 0** uma tarefa 0.8: spike de 1 dia — "Hello SW": Serwist (ou alternativa) compilando no build de produção, `next build` documentado como webpack/turbopack, SW registrado e cacheando uma rota. Se o spike falhar, re-planejar a Fase 3 antes de gastar as Fases 1–2. Adicionar ao aceite da Fase 3: build Docker produz SW funcional (testar dentro do container, não só em dev).

### B2 — [SEVERIDADE: bloqueante] Gestos (3.2) conflitam com o scroll vertical da cifra — o plano ignora a física do problema

**Problema:** A cifra rola verticalmente (`touchAction: 'pan-y'` em `CifraViewer.tsx:198`, container `overflow-auto`). O plano adiciona swipe horizontal (troca música), pinch (zoom) e long-press (concluir) via `@use-gesture/react` **no mesmo elemento rolável**. Consequências reais: (a) para capturar swipe/pinch de forma confiável, a tendência é setar `touch-action: none`, o que **mata o scroll nativo da cifra** — o gesto mais importante do palco; (b) long-press no iOS dispara seleção de texto/callout nativo; (c) diagonal vira disputa entre scroll e swipe. O plano não menciona nenhuma dessas três armadilhas nem critério de teste.
**Correção:** especificar no plano: `touch-action: pan-y` mantido + detecção de swipe por **trava de eixo com threshold** (ex.: horizontal só ativa após >24px de deslocamento horizontal dominante, com `axis: 'x'` e `threshold` no use-gesture); pinch apenas quando `event.touches === 2` sem preventDefault do scroll de 1 dedo; `user-select: none` + `-webkit-touch-callout: none` no container do palco para o long-press. Aceite testável: "scroll vertical de 1 dedo nunca troca de música; swipe horizontal com >30° de inclinação nunca troca de música" — validado em aparelho iOS **e** Android, não só em DevTools.

### B3 — [SEVERIDADE: bloqueante] Estimativas da Fase 3 são ficção (5–8 dias para 8 tarefas pesadas)

**Problema:** A Fase 3 soma: rewrite completo da página de setlist (hoje 398 linhas acopladas a sidebar/observações/áudio/DrumPad), sistema de gestos, hotkeys/pedal com gerenciamento de foco, tela entre-músicas, PWA offline com pré-cache + espelho IndexedDB (duas estratégias redundantes no mesmo item — ver I4), setup de e2e Playwright do zero (infra, seed, browsers no CI) **e** baseline de a11y com axe no CI. Qualquer subconjunto de 3 desses itens já estoura 8 dias com qualidade. Estimativa realista: 12–18 dias.
**Correção:** dividir a Fase 3 em **3A (Modo Stage: 3.1–3.5)** e **3B (Confiabilidade: 3.6–3.8)**, com o spike de PWA antecipado (B1). Ou cortar escopo da fase: e2e completo e axe ficam só com smoke tests, e o resto vira Fase 3C. O princípio 4 do próprio plano ("fases curtas e entregáveis") está sendo violado pelo próprio plano.

### B4 — [SEVERIDADE: bloqueante] Fase 0.1: script destrutivo de saneamento de órfãos sem backup prévio obrigatório

**Problema:** A tarefa 0.1 liga `PRAGMA foreign_keys = ON` e roda um script que **reporta/limpa órfãos** no único arquivo de dados do usuário (`data/chordset.db` — confirmado: é um arquivo único, sem backup automatizado). Um bug no script de limpeza = perda de dados de produção, irrecuperável. Além disso, ligar FK muda o comportamento de deletes existentes: código atual pode depender silenciosamente de deletes que não cascateavam (órfãos hoje são "tolerados"); o aceite "teste de cascade deletando música" não cobre os outros caminhos (deletar evento, template, drum_pattern).
**Correção:** (a) aceite obrigatório: `sqlite3 .backup` (ou cópia do arquivo) antes de qualquer saneamento, automatizado no próprio script (`--dry-run` por padrão, `--apply` explícito); (b) testes de cascade para **todas** as FKs do schema (eventos, templates, drum_patterns, practice_sessions — confirmadas em `data/schema.sql`), não só música; (c) rodar primeiro em cópia do banco de produção e anexar o relatório de órfãos ao PROGRESS.md.

---

## IMPORTANTES

### I1 — [SEVERIDADE: importante] Dependência errada: Fase 1 reestiliza componentes que a Fase 2/3 reescreve

**Problema:** A Fase 1.4 ("componentes UI", "eliminar `dark:` órfãs do ChordViewer/ImportPhotoModal", aceite "app inteiro dark-first consistente, zero cor hardcoded") mexe em `ChordViewer`, `CifraViewer` e na página de setlist — que serão **reescrevidos** nas Fases 2.1 e 3.1. É trabalho dobrado garantido: primeiro retrofit visual, depois rewrite estrutural joga o retrofit fora.
**Correção:** delimitar a Fase 1 explicitamente ao **Backstage** (listas, forms, nav, homepage). Cifra/Stage entram no dark-first apenas quando reescritos (Fases 2–3). Ajustar o aceite da Fase 1 para "app Backstage dark-first; telas de cifra/setlist serão migradas nas Fases 2–3".

### I2 — [SEVERIDADE: importante] Fase 0 subestimada (2–4 dias para 7 tarefas) e com aceite impossível de provar

**Problema:** (a) Somar migrations versionadas + saneamento + auth/rate-limit + mudança de storage de áudio com migração de arquivos + zod em várias rotas + CI com build Docker + hardening Docker em 2–4 dias é otimista (realista: 4–6 dias). (b) O aceite da 0.4 — "banco novo e banco antigo convergem para o mesmo schema" — não diz **como** se prova convergência; bancos antigos têm ALTERs ad-hoc fora do `schema.sql` (confirmado na auditoria: colunas concatenadas na linha do `updated_at`), e SQLite não faz converge fácil sem rebuild de tabela. (c) A 0.7 ("rodar como `nextjs`") **quebra o deploy existente**: o volume `/data` em produção tem arquivos owned por root (o container hoje roda `USER root` — confirmado no Dockerfile); trocar o usuário sem `chown` no entrypoint = app não abre no próximo deploy.
**Correção:** (a) reestimar 4–6 dias; (b) aceite objetivo: script de verificação que compara `PRAGMA table_info`/`index_list` de um banco migrado contra um banco fresco, dump diff no CI; (c) entrypoint com `chown -R nextjs /data` antes do `su nextjs` (ou documentar migração manual do volume) — e testar o deploy de upgrade no Coolify, não só build limpo.

### I3 — [SEVERIDADE: importante] Scraper Playwright: o vazamento de páginas é bug de estabilidade em produção e ficou fora de todas as fases

**Problema:** A auditoria técnica (3.3) apontou: `finally` vazio que nunca fecha a `Page` (vazamento a cada importação), singleton sem `browser.on('disconnected')` nem re-launch após crash. Isso é um **bug de produção hoje** — cada importação de cifra deixa lixo no Chromium dentro do container com pouca RAM. O plano só menciona o scraper na tabela de riscos ("reengenharia na Fase 3"), mas **não existe tarefa de scraper na Fase 3** — o item caiu no limbo entre a tabela de riscos e o plano de trabalho.
**Correção:** hotfix barato já na Fase 0 (nova tarefa 0.8): `await page.close()`/`context.close()` no `finally`, handler de `disconnected` com re-launch. A reengenharia fetch+Cheerio fica como tarefa explícita na Fase 3 (ou sai do plano de vez — mas não fica na tabela de riscos fingindo estar planejada).

### I4 — [SEVERIDADE: importante] Offline (3.6) tem duas estratégias redundantes e ignora as armadilhas de iOS

**Problema:** A tarefa manda fazer "pré-cache das cifras" via service worker **e** "espelho de leitura em IndexedDB" — duas fontes de verdade de leitura sem dizer qual manda, quando cada uma é usada, nem como invalidar. Ainda: (a) iOS Safari **evicta Cache Storage/IndexedDB de PWAs sem uso recente** — exatamente o cenário "abri o evento segunda, show é sábado" falha; o aceite "modo avião → setlist abre" precisa de re-teste periódico e de um botão "verificar offline" com status de cache por música; (b) pré-cache de áudio de referência pode explodir a quota; (c) o Basic Auth convive com SW (credenciais same-origin vão junto), mas o `manifest`/ícones precisam passar pelo middleware — hoje qualquer URL com `.` já bypassa auth (`middleware.ts:16`), o que funciona por acidente e deve ficar explícito.
**Correção:** escolher **uma** estratégia primária (recomendo: SW com CacheFirst para rotas GET de cifra/setlist do evento ativo + indicador de "baixado ✓" por música; IndexedDB só se o SW provar-se insuficiente no spike B1). Excluir áudio do pré-cache por padrão. Aceite revisado: "com o evento aberto online uma vez, ativar modo avião e recarregar → setlist completo navegável; status de cache visível antes do show".

### I5 — [SEVERIDADE: importante] 4B.2 "Palco Conectado": WebSocket não existe no servidor standalone do Next — custo escondido

**Problema:** O plano diz "SSE/WebSocket" como se fossem intercambiáveis. Não são: `next start`/standalone **não suporta WebSocket** — exigiria custom server (jogando fora o `output: 'standalone'` e o Dockerfile atual) ou um serviço separado. SSE funciona em route handler, mas atrás do Coolify/Traefik precisa de `X-Accel-Buffering: no`, timeouts de proxy ajustados e heartbeat — senão conexões morrem silenciosamente no meio do show. E "líder avança → dispositivos seguem" em container single-instance funciona em memória, mas o plano não diz isso (se um dia escalar para 2 instâncias, quebra sem pub/sub).
**Correção:** decidir agora: **SSE com heartbeat de 15s** + documentação de config de proxy no Coolify (ou teste real no ambiente de deploy). Escrever "WebSocket descartado — SSE unidirecional líder→músicos é suficiente para o caso" no plano. Limitar o escopo declarado a single-instance.

### I6 — [SEVERIDADE: importante] Ancoragem de anotações (4A) por linha é frágil e vai quebrar silenciosamente

**Problema:** Schema proposto: `annotations(musica_id, evento_id, linha/anchor, ...)`. Âncora por índice de linha quebra quando: o usuário edita a cifra, a transposição re-renderiza, ou o rewrite do ChordViewer (2.1) muda a segmentação de linhas. Anotação deslocada silenciosamente é pior que nenhuma anotação — no palco o músico confia na marcação.
**Correção:** ancorar por **conteúdo** (hash da linha + offset de ocorrência + contexto antes/depois, com fallback fuzzy) e aceite: "editar a cifra inserindo 3 linhas acima → anotação continua na linha certa ou é marcada como órfã visível". Definir também o que acontece com anotações ao transpor (âncora na letra, não no acorde — especificar).

### I7 — [SEVERIDADE: importante] Backup está classificado como "quick win conforme energia" — é fundação

**Problema:** Todo o acervo do usuário é um arquivo SQLite único em um volume Docker (auditoria 3.11: sem backup). O plano joga "Backup/export-import JSON" para a Fase 4C, "conforme energia" — depois de design system, cifra, stage e PWA. Enquanto isso, a Fase 0 roda scripts destrutivos (B4) e a Fase 0.4 reescreve migrations **sobre o banco de produção**. A janela de risco de perda total de dados é exatamente durante as Fases 0–1.
**Correção:** promover "export JSON completo + restore testado" para a Fase 0 (é pré-requisito de segurança para 0.1/0.4, além de feature). Litestream/cron pode ficar para depois, mas o export manual testado não pode.

### I8 — [SEVERIDADE: importante] Tone.js no bundle do palco não é tratado em lugar nenhum

**Problema:** `import * as Tone from 'tone'` está em 5 arquivos, incluindo `DrumPad.tsx` e `Metronome.tsx` — e a página de setlist importa `DrumPad` (`eventos/[id]/setlist/page.tsx:9`), ou seja, o Tone.js inteiro entra no bundle da tela mais performance-crítica do app. Tone é pesado (centenas de KB minificado) e a Fase 2.4 ainda adiciona metrônomo visual sincronizado ao `Tone.Transport` na tela da cifra. Em tablet de palco mediano + PWA, isso impacta carregamento e pré-cache. O plano e as fases não mencionam lazy-loading nem budget de bundle.
**Correção:** tarefa explícita na Fase 2 ou 3: `next/dynamic` (ou `await import('tone')` sob demanda) para DrumPad/Metronome na página de setlist; aceite: bundle da rota de setlist relatado no PROGRESS (ex.: First Load JS da rota < X KB — medir antes e depois). Aproveitar para resolver o `Tone.start()` que exige gesto do usuário (relevante ao "count-in" da tela entre-músicas).

### I9 — [SEVERIDADE: importante] Pedal/teclado (3.3) sem gerenciamento de foco vai falhar de formas bobas

**Problema:** "Espaço = autoscroll": se qualquer botão estiver focado (e depois de qualquer toque/clique algo fica focado), espaço **ativa o botão** em vez de rolar/toggle. Setas também rolam a página se o preventDefault não for global e correto. Pedais AirTurn/PageFlip emulam teclas — o app não pode depender de onde está o foco. O plano também promete fullscreen "automático" ao entrar (3.1): browsers exigem gesto do usuário para fullscreen (e Wake Lock em iOS só a partir de 16.4+ e precisa re-adquirir em `visibilitychange`).
**Correção:** especificar: hotkeys registrados em `window` com `preventDefault` e `ignoreEventWhen(target é input/textarea/select)`; fullscreen/Wake Lock disparados no **primeiro toque** (não no load), com re-aquisição de Wake Lock ao voltar à aba; aceite testado com pedal real ou simulador de teclas HID (documentar qual pedal foi validado).

---

## MENORES

- **M1 — [menor]** Aceite "ler cifra a 1,5m de distância no escuro" (Fase 2) não é testável por agente/CI. → Traduzir para: px mínimos (já definidos: 20px), contraste medido ≥7:1 via axe, mais um checklist manual registrado no PROGRESS.
- **M2 — [menor]** "Lighthouse a11y ≥ 85" (Fase 1) é fraco e inconsistente: axe-core no CI só entra na Fase 3. → Subir axe para a Fase 1 (é uma dependência e um script) e fixar meta ≥ 90 já que o app é pequeno.
- **M3 — [menor]** Rate limit "contador em memória por IP" (0.2): atrás do proxy do Coolify `request.ip` vem vazio — precisa ler `x-forwarded-for` com política de confiança documentada, senão o limite ou não funciona ou bloqueia todo mundo junto (mesmo IP do proxy).
- **M4 — [menor]** CI com "build Docker como gate" em todo PR: build com `npm ci` + `next build` + Chromium leva vários minutos e vai virar o gargalo do fluxo de subagentes commit-por-tarefa. → Gate de PR = lint+tsc+test; build Docker só em merge na main ou nightly.
- **M5 — [menor]** Resolver `--legacy-peer-deps` (0.7) pode não ser trivial: se o conflito for de peer de alguma lib travada (ex.: `lucide-react@^1.24.0` é versão suspeita/inexistente no registro público), "resolver" pode significar trocar de biblioteca. → Aceite revisado: "`npm ci` limpo **ou** decisão documentada de manter o flag com a causa identificada".
- **M6 — [menor]** `middleware.ts:16` (`url.includes('.')`) é um bypass de auth mais largo que o das rotas cifraclub e ninguém mencionou: qualquer path contendo `.` pula autenticação. → Incluir no 0.2: trocar por allowlist explícita de extensões estáticas.
- **M7 — [menor]** Aceite da Fase 0.5 "sem `SQLITE_BUSY` sob escrita concorrente" precisa de teste que o provoque (duas escritas simultâneas no mesmo DB em memória/arquivo temporário), senão é afirmação decorativa.
- **M8 — [menor]** Constraint `UNIQUE(evento_id, ordem)` (auditoria 3.9) e o dedup O(n) `getAll().find()` em `import-song` (auditoria 3.10) não entraram em fase nenhuma. → Ambos cabem na Fase 0.4/0.5 por 1 hora de trabalho cada; incluir.
- **M9 — [menor]** A Fase 4B.1 (links públicos com token) vai exigir novo bypass no middleware — que acabou de ser fechado na Fase 0.2. Sem especificação, vira o próximo `includes('.')`. → Especificar já: bypass apenas para `/eventos/compartilhado/[token]` com validação do token na rota, revogação e rate limit.
- **M10 — [menor]** Nenhuma fase menciona migração de dados dos áudios existentes de dev (`public/`) nem validação do warning de lint restante (`<img>` em `musicas/new/page.tsx`) — pequenos, mas o plano promete "lint verde a cada commit" como gate: warnings contam ou não? → Definir.

---

## Veredito

**Aprovado com mudanças** — condicionado à incorporação dos bloqueantes B1–B4 e dos importantes I1–I9 **no texto do plano** antes do início da execução:

1. **B1** (spike de PWA na Fase 0) e **B2** (estratégia de gestos × scroll) devem virar tarefas com aceite escrito — são as duas maiores incógnitas técnicas e estão invisíveis hoje.
2. **B3**: redividir a Fase 3 em 3A/3B com estimativas realistas; **I2**: Fase 0 para 4–6 dias.
3. **B4/I7**: nenhum script destrutivo roda sem backup/export prévio — promover export JSON à Fase 0.
4. **I3**: hotfix do vazamento de páginas do scraper entra na Fase 0 (é bug de produção, não melhoria).
5. **I5**: decidir SSE-agora e escrever a decisão; **I1**: escopo da Fase 1 limitado ao Backstage para não pagar retrabalho.

O plano acerta a estratégia (corrigir → embelezar → palco → features) e os aceites são, em geral, mais objetivos que a média. Mas do jeito que está, as duas fases mais caras (0 e 3) carregam riscos técnicos não decompostos que, na prática, explodiriam no meio da execução. Com as mudanças acima, pode ir.
