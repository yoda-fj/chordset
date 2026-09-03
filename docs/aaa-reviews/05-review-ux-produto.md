# Revisão #05 — UX/Produto do Plano Triple A (v1)

**Revisor:** Revisor B — Produto/UX (ex-design lead de apps de música)
**Data:** 2026-09-03
**Documentos lidos:** `PLANO-TRIPLE-A.md`, `01-ux-audit.md`, `02-tech-audit.md`, `03-product-proposals.md`
**Lente do dono:** uso pessoal · prioridades **visual/design → confiabilidade no palco → features novas** · sonhos: anotar na cifra + compartilhar setlist (em fases) · foco primeiro no que já existe.

---

## Leitura geral

O plano acerta na espinha dorsal: Fase 0 (riscos) → Fase 1 (salto visual) → Fase 2 (cifra) → Fase 3 (palco) → Fase 4 (sonhos). A visão "Backstage/Stage" é exatamente a da auditoria UX, e a decomposição 4A/4B respeita a direção "em fases" do dono. Os problemas estão **no recheio perceptível**: motion, empty states e transições — justamente o que separa "funcional" de "triple A" — estão sub-representados e fora dos critérios de aceite, que medem funcionalidade, não experiência.

---

## Críticas

### C1 — [ALTA] Motion/micro-interações sem dono e sem fase
**Problema:** A auditoria (§1.6) aponta motion quase inexistente e propõe um roadmap com "Polimento (contínuo)" como 4ª etapa. O plano dilui isso: `layoutId` na tab bar (1.6) e `AnimatePresence` no Stage (3.1), mas **nenhuma tarefa cobre** stagger de listas, `whileTap` nos botões, transições de página, check animado de "música concluída", nem **skeletons substituindo os spinners `Loader2`/"Carregando..."** (1.4 cria o componente `Skeleton`, mas nenhuma tarefa manda usá-lo). `prefers-reduced-motion` só aparece na 3.8, três fases depois de o motion entrar.
**Correção:** Criar tarefa 1.8 "Motion system": springs globais, entrada de listas com stagger, `whileTap={{scale:0.97}}` em botões/cards, transições de rota, **skeletons em todas as páginas de lista** (músicas/eventos/ensaios/ritmos), e media query global de `prefers-reduced-motion` (mover da 3.8 para cá). Adicionar ao aceite da Fase 1: "zero spinner de loading; toda lista tem skeleton; animações desligam com reduced-motion".

### C2 — [ALTA] Critérios de aceite medem funcionalidade, não excelência de experiência
**Problema:** Os aceites são binários/funcionais: "request sem auth → 401", "e2e verde", "PR quebrado não mergeia". Os bons (Fase 2: "ler a 1,5m no escuro"; Fase 3: "show completo só com pedal") são exceção. Nada captura o perceptível: tempo de transição entre músicas, ausência de flash branco ao entrar no Stage, chrome auto-hide verificado, first paint do modo escuro sem "piscada" clara (FOUC de tema — risco real com `next-themes`).
**Correção:** Adicionar por fase 2–3 critérios perceptíveis mensuráveis: Fase 1 → "app abre já em escuro, sem flash claro, em cold start" e "Lighthouse a11y ≥ 95 (não 85 — ver C6)"; Fase 3 → "troca de música por swipe/pedal < 300ms percebidos, sem repaint branco", "chrome some em 3s e reaparece em 1 toque — verificado em device real", "tela entre-músicas exibida em 100% das transições".

### C3 — [ALTA] Empty states e estados de erro globais fora do plano
**Problema:** A auditoria (§1.8) registra empty states/erros inconsistentes entre páginas. O plano só cobre empty states da **homepage** (1.7, "CTA duplo"). Listas vazias de Músicas/Eventos/Ensaios/Ritmos — as telas que o usuário vê todo dia — ficam de fora. Para um plano cujo princípio é "depois desta fase o app já parece triple A", uma lista vazia com texto cru derruba a promessa.
**Correção:** Ampliar 1.7 ou criar 1.9 "Estados vazios e de erro globais": padrão único (ilustração/ícone + título + CTA primário + CTA secundário) aplicado às 4 seções; estado de erro com retry padronizado; erro de rede no modo Stage com mensagem calma (não técnica).

### C4 — [ALTA] Fase 4B.2 ("Palco Conectado") é um bloco monolítico sem aceite
**Problema:** 4B.1 está ótimo (link read-only com token, sem auth nova — certo para single-user). Mas 4B.2 embrulha em uma linha: sessão/presença, sync de posição via SSE/WebSocket, **e** transposição por instrumento — três features com riscos distintos. A Fase 4 inteira **não tem critérios de aceite nem estimativas**, quebrando o próprio princípio 4 ("fases curtas e entregáveis, aceite objetivo").
**Correção:** Decompor 4B.2 em: **4B.2a** — sessão ao vivo: líder avança música → dispositivos seguem (só índice da música, SSE basta); aceite: 2 dispositivos na mesma rede sincronizam em < 1s. **4B.2b** — tom por instrumento/membro; aceite: membro em Bb vê cifra transposta sem afetar o líder. Adicionar linha de aceite também para 4A.1 ("anotação persiste por música e por evento; visível no modo Stage sem poluir a leitura") e 4B.1 ("link abre sem login; revogar invalida em < 1min").

### C5 — [MÉDIA] "Entre músicas" perdeu o count-in e o Stage não cita tablet/desktop
**Problema:** (a) A auditoria propunha "count-in opcional de 4 tempos" na tela entre músicas — sumiu do 3.4; para quem toca com metrônomo, é o momento de maior ansiedade do show. (b) A auditoria (§1.5) aponta a sidebar `hidden lg:block` sem modo tablet intermediário; o rewrite 3.1 não declara que o Modo Stage deve funcionar em **tablet** (o dispositivo real de palco) — risco de nascer mobile-only de novo.
**Correção:** Incluir no 3.4 "count-in opcional (4 tempos, configurável por evento)" e adicionar ao aceite da Fase 3: "Modo Stage verificado em 3 viewports: celular, tablet 10\" (pedestal) e desktop; nenhuma ação primária exige abrir sidebar/overlay".

### C6 — [MÉDIA] Meta de a11y contradiz o princípio WCAG AAA
**Problema:** O princípio 1 declara "contraste WCAG AAA", mas o aceite da Fase 1 é "Lighthouse a11y ≥ 85" — meta de produto mediano, não triple A, e incoerente com o princípio.
**Correção:** Subir para "Lighthouse a11y ≥ 95 + contraste dos pares texto/fundo do modo Stage validado ≥ 7:1 (lista explícita no PR)".

### C7 — [MÉDIA] Bug crítico do ChordViewer (2.1) deveria subir para a Fase 1
**Problema:** O bug 🔴 (zoom não escala + `CHAR_WIDTH` desalinhando acordes) é **o defeito mais visível do coração do produto** e não depende do design system. Pela ordem atual, o dono passa a Fase 1 inteira (3–5 dias) olhando para uma cifra desalinhada com visual novo — o "salto triple A" entrega casca sem consertar o miolo. O princípio 3 ("corrigir antes de construir") vale para técnica; deveria valer também para o defeito visual nº 1.
**Correção:** Promover 2.1 (rewrite acorde/sílaba empilhado + testes com fixtures reais) para a Fase 1 como 1.0 ou tarefa inicial da fase. A escala tipográfica/stepper/metrônomo visual ficam na Fase 2 normalmente.

### C8 — [MÉDIA] Onboarding enterrado em 4C está certo — mas empty-state não é onboarding
**Problema:** Para uso pessoal, "onboarding com 5 músicas demo" em 4C é corretíssimo (o dono já tem dados) — **manter lá**. O erro seria confundir isso com os empty states globais (C3), que são fundação, não feature.
**Correção:** Nenhuma mudança de posição para onboarding; apenas garantir que C3 seja absorvida na Fase 1 e que 4C permaneça "conforme energia".

### C9 — [MÉDIA] Teleprompter calibrado é confiabilidade de palco, não quick win
**Problema:** "Teleprompter calibrado (duração por música, marcadores de seção)" está em 4C, mas a auditoria de produto classifica o autoscroll rudimentar como gap médio-alto **de palco** (gap #7) — a prioridade nº 2 do dono. O swipe com "dois dedos pausa autoscroll" da auditoria também sumiu do 3.2.
**Correção:** Mover "marcadores de seção clicáveis + duração calibrada por música" para a Fase 3 (item 3.9, pode ser versão mínima: duração estimada por BPM × linhas). Restaurar o gesto de dois dedos no 3.2. Player de referência e os demais 4C ficam onde estão.

### C10 — [BAIXA] Inconsistências menores de escopo
**Problema:** (a) `cmdk` é instalado como dep na Fase 1 mas a command palette só aparece em 4C — dep órfã ou feature sem fase. (b) Diagramas de acordes e capo (benchmark: table stakes do OnSong/SongBook) não aparecem nem no "NÃO fazer" — decisão não registrada.
**Correção:** (a) Ou mover "⌘K palette mínima (ir para música, abrir setlist de hoje)" para o fim da Fase 1, ou remover `cmdk` das deps. (b) Adicionar à seção 8: "❌ Diagramas de acordes/capo agora — dependem de ChordPro nativo (Onda 2 do relatório de produto), fora do foco 'o que já existe'".

---

## O que está bom (registrar para não desmontar na v2)

- Fase 0 antes de tudo: correta mesmo com prioridade visual — 2–4 dias de fundação não matam o momentum e os 3 riscos são existenciais. (Se quiser dopamina visual no dia 1, puxe só o branding 1.5, que é barato.)
- Aceites da Fase 2 ("1,5m no escuro") e Fase 3 ("show inteiro só com pedal", "modo avião") são exemplares — estender esse padrão às demais.
- 4A.1 com schema proposto e 4B.1 sem auth nova: decomposição madura.
- Seção "O que NÃO fazer" preserva o charme single-user self-hosted — alinhado ao dono.

---

## Veredito

**APROVADO COM MUDANÇAS.**

A estrutura de fases e a visão estão certas; o que falta é garantir que o "triple A" seja **sentido**, não só testado: motion e empty states precisam de tarefas próprias (C1, C3), os aceites precisam medir experiência perceptível (C2, C6), o bug nº 1 da cifra deve subir uma fase (C7) e 4B.2 precisa de decomposição com aceite (C4). Nenhuma mudança altera a ordem macro das fases nem o escopo — são correções cirúrgicas dentro da v1.
