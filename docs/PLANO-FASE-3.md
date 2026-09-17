# ChordSet — Plano Fase 3: Modo Stage + Confiabilidade no palco

**Data:** 2026-09-17 · **Status:** proposta para execução (deriva do PLANO-TRIPLE-A §7–8, reconciliado com evidência nova)
**Fontes:** `docs/PLANO-TRIPLE-A.md` (Fases 3A/3B) · review UX 2026-09-16 (agente "Steve Jobs", screenshots mobile/desktop) · review de código 2026-09-16 (achados médios/baixos pós-pacote `4f81adb`)
**Branch:** `fase-3-stage` (PR por onda, mesmo padrão da Fase 2)
**Governança:** execução por subagentes (um por tarefa), revisão em dois estágios, gate contínuo `lint --max-warnings 0` + `tsc` + `test`, PROGRESS.md atualizado por onda.

---

## Contexto que mudou desde o PLANO v2

A Fase 2 entregou mais do que o previsto e o review de UX (com screenshots reais) confirmou a tese do plano: **o app ainda é de gerenciamento querendo ser de palco**. Evidências novas que afunilam o escopo da 3A:

- Chrome consome ~45% do viewport da cifra no mobile (Imprimir em destaque âmbar, toolbar em 2 fileiras) — antecipa a 3.1.
- Trocar de música no setlist mobile depende do drawer (alvos ~24px) — antecipa 3.4.
- Botão flutuante "‹" sobre a zona de scroll da cifra — alvo de toque acidental no palco.
- Auto-scroll com feedback criptográfico ("0% → 2%") — antecipa 3.5.
- Contraste de metadados críticos (tom, "1 de 2") insuficiente sob luz de palco.
- Toolbar de controles com ordem/layout diferentes por tela (cifra vs setlist vs ensaio).
- Ritmo/BPM/volume agora existem nas 3 telas de estudo e seguem a música (base `4f81adb`) — o Stage herda isso; metrônomo e autoscroll já respondem ao BPM ao vivo.

Fora do palco, mas no caminho: dívida de código dos reviews (leaks de timer, race restante, limites de BPM divergentes, props mortas) e lacunas de teste no hook `useDrumPadSettings` — viram **Onda 0** para o Stage não nascer sobre areia movediça.

---

## Onda 0 — Higiene pré-Stage (1–2 dias) 🧹

| # | Tarefa | Aceite |
|---|--------|--------|
| 3.0.1 | **Fix leaks de timer:** auto-restart do DrumPad guarda o `setTimeout` em ref e limpa no unmount; `playRitmo` usa flag de montagem (ou `onload` do sampler) em vez de 1500ms fixo | Trocar de música/ sair da página durante play não deixa interval/transport órfão — teste headless |
| 3.0.2 | **Volume 0 silencia:** `volumeToDb(0)` → `-Infinity` (card de ritmo ganha comportamento de mute real) | Slider no mínimo = silêncio |
| 3.0.3 | **Unificar limites de BPM:** 40–220 em card, DrumPad, Metronome e schema zod (hoje 40–200/40–220/20–400) | Um único `BPM_MIN/BPM_MAX` exportado de `src/lib/constants.ts` |
| 3.0.4 | **Limpar props mortas:** `readOnly` (DrumPad), `onFullscreenChange` (CifraViewer — remover prop e listener duplicado na página), `compact` (Metronome); remover `getSamplePaths` (duplicata de `getSamplerUrls`) | `tsc` sem referências; diff sem comportamento |
| 3.0.5 | **zod em practice-sessions** (POST/PUT: status/difficulty enum, tempo ≥ 0), seguindo padrão de musicas | Payload inválido → 400 com issues |
| 3.0.6 | **Testes das lacunas:** `useDrumPadSettings` (override encadeado, debounce, flush com id correto), DrumPad preservando `initialBpm≠preset`, Autoscroll modo BPM (`pxPerSecond`), card de ritmo (saveRitmo cancela pendente) | +8–12 testes, todos verdes |
| 3.0.7 | **Hotfix página de ensaio:** corrigir overflow horizontal (`scrollWidth > clientWidth` no mobile, confirmado no review) | Sem rolagem horizontal em 390px |

**Gate Onda 0:** lint:ci ✅ · tsc ✅ · testes ✅ (125+) · sem mudança comportamental além dos fixes.

---

## Onda 1 — Núcleo do Modo Stage (3–4 dias) 🎤

| # | Tarefa | Aceite |
|---|--------|--------|
| 3.1 | **Rewrite do setlist como Modo Stage** (deriva 3.1 do plano v2): chrome auto-hide 3s (`AnimatePresence`), reaparece em 1 toque; fullscreen + Wake Lock no **primeiro toque**; re-aquisição em `visibilitychange`; título `stage-lg` + "3/12 · próxima: X"; **fim do botão flutuante "‹" sobre a cifra** (painel vive no chrome/toolbar) | Chrome some em 3s e volta em 1 toque — device real |
| 3.2 | **Gestos com trava de eixo** (`@use-gesture/react`): swipe horizontal só com deslocamento dominante >24px; **>30° de inclinação nunca troca música**; `user-select:none` + `-webkit-touch-callout:none`; 2 dedos pausa autoscroll; scroll de 1 dedo nunca troca música | Validado em iOS E Android reais |
| 3.3 | **Navegação de palco:** botão "Próxima ▶" flutuante 72px âmbar + **tela entre-músicas** (cartão gigante: título/tom/BPM/ritmo) + contador gigante "3/12" + **count-in de 4 tempos** opcional por evento | Transição sempre com entre-músicas; drawer deixa de ser o caminho de troca |
| 3.4 | **Toolbar unificada:** um único componente de controles (transpor/zoom/olho/autoscroll/fullscreen) com ordem fixa, reusado na cifra e no Stage; variante "compacta" para backstage | Mesma ordem e aparência nas telas — diff de screenshots vazio |

**Gate Onda 1:** lint:ci ✅ · tsc ✅ · testes ✅ · e2e básico de troca de música · screenshots 3 viewports anexados ao PR.

---

## Onda 2 — Controles de performance (2–3 dias) 🎛️

| # | Tarefa | Aceite |
|---|--------|--------|
| 3.5 | **Pedal Bluetooth/teclado** (`react-hotkeys-hook`): `→/↓/←/↑/espaço/F/+/-`; ignora quando target é input/textarea/select; não conflita com atalhos do DrumPad (QWERTY/ASDFG/ESPAÇO) — **ESPAÇO do pedal não liga o drum pad** | Show completo só com pedal — validado com pedal real ou simulador HID |
| 3.6 | **Barra de progresso da música** no topo ligada ao autoscroll + **controle de autoscroll honesto**: play/pause grande + níveis 1–5 visíveis (fim do "0%→2%"); acompanha BPM ao vivo | Feedback legível a 1 metro |
| 3.7 | **Teleprompter mínimo** (3A.6): duração estimada por BPM × nº de linhas + marcadores de seção clicáveis que posicionam o scroll | Seção clicável posiciona o scroll |
| 3.8 | **Contraste de palco:** tom/BPM/posição em tom quase-puro, mínimo 16–18px; metadados críticos medidos **≥7:1**; cor âmbar reservada à ação primária | Medição contraste anexada ao PR |

**Gate Onda 2:** lint:ci ✅ · tsc ✅ · testes ✅ · **Lighthouse a11y ≥ 95 nas telas de palco**.

---

## Onda 3 — Validação de palco (1 dia) ✅

| # | Tarefa | Aceite |
|---|--------|--------|
| 3.9 | Passo a passo de show simulado (evento real do usuário) em 3 viewports: celular, tablet 10" pedestal, desktop; checklist manual registrado no PROGRESS.md | Checklist assinado no PROGRESS |
| 3.10 | Métricas: First Load da rota Stage, chunks, contraste, a11y — registradas no PROGRESS.md | — |

---

## Fase 3B — Confiabilidade no palco (5–7 dias, começa após gate da Onda 3) 🛡️

Inalterada do PLANO-TRIPLE-A §8, com prioridade ajustada pela experiência da Fase 2:

| # | Tarefa | Aceite |
|---|--------|--------|
| 3B.1 | **PWA offline** (depende do spike 0.8 — GO confirmado): SW CacheFirst para GETs de cifra/setlist do evento ativo; indicador "baixado ✓" por música; áudio fora do pré-cache; nota sobre eviction iOS | Evento aberto 1× online → modo avião + reload → setlist navegável |
| 3B.2 | **e2e Playwright** no CI: criar evento → montar setlist → modo performance | e2e verde no CI |
| 3B.3 | **A11y baseline restante:** landmarks, `focus-visible`, live-regions | axe limpo global |
| 3B.4 | **Reengenharia scraper:** fetch+Cheerio primeiro, Playwright fallback; mutex; cache por URL; retry backoff | Import feliz sem Chromium |

---

## Quick wins mapeados (não entram na Fase 3; puxar para 4C conforme energia)

Do review UX 2026-09-16: card de música clicável inteiro · lista de ritmos sem ruído (sem data/kit redundante, play grande, lixeira com confirmação) · hierarquia do detalhe da música ("Ver Cifra" como protagonista) · metrônomo ±5/toque-longo ±1 com TAP em destaque · ensaio em abas Praticar/Ajustes (redesign; o overflow fica na 3.0.7) · lazy-load do Tone.js em `ritmos/*` e `musicas/[id]` (pendente desde a 2.7).

## O que continua NÃO fazer

❌ WebSocket (SSE na 4B.2a) · ❌ escrita offline · ❌ SaaS multi-tenant · ❌ features da Fase 4 antes do gate da 3B.
