# ChordSet — Propostas de Produto (Visão Triple A)

**Autor:** Product Management
**Data:** 2026-09-03
**Contexto:** o dono quer transformar o ChordSet de ferramenta pessoal funcional em produto triple A com experiência excelente. Este documento analisa o estado atual, faz benchmark com líderes de mercado, propõe features em 3 ondas priorizadas e lista riscos e o que NÃO fazer.

---

## 1. Análise do que já existe e gaps de produto

### 1.1 O que já existe (inventário real do código)

Baseado em `PROGRESS.md`, `src/` e migrations:

**Core de repertório**
- CRUD de Músicas (tags, tom, cifra em texto, observação, áudio gravado, bpm/volume, groove, drum_pattern)
- CRUD de Templates (repertórios reutilizáveis) com drag-and-drop
- CRUD de Eventos com repertório, clone de evento, importar de template, auto-save de tom/observações por música
- "Study lists" (eventos sem data) como lista de estudo
- Modo Performance/Setlist: fullscreen, wake lock, autoscroll com velocidades (1x–3x), controles de fonte, transposição de tom em tempo real

**Cifras**
- Engine única de transposição (`chord-transposer.ts`, regex-based, com testes)
- Conversor texto-espaçado → ChordPro (`chordpro-converter.ts`) — existe, mas é utilitário interno, não uma feature de produto
- Importação via scraping do Cifra Club (Playwright + Cheerio, server-side)
- Importação por foto (OCR via LLMs de visão: OpenAI / Gemini / OpenRouter) com revisão antes de salvar

**Prática/Ensaio**
- Sessões de prática com cronômetro, metrônomo (Tone.js), status (needs_practice → practiced → mastered), dificuldade, tempo acumulado
- `PracticeStats`: totalizações básicas (músicas, tempo)
- Ritmos/Drum patterns + DrumPad com samples (Tone.js)
- Gravação de áudio por música e por evento (`AudioRecorderPanel`)

**Infra**
- Next.js 16 + SQLite (better-sqlite3) + Tailwind, mobile-first, Docker, Basic Auth (single-user), testes Vitest nos módulos puros

### 1.2 Gaps de produto (o que impede o "triple A")

| # | Gap | Impacto |
|---|-----|---------|
| 1 | **Sem modo offline** — app depende do servidor para tudo; no palco/ensaio com Wi-Fi ruim ou 4G fraco, o músico fica sem cifra | Crítico: é o cenário de uso mais hostil e o mais frequente |
| 2 | **Single-user com Basic Auth** — sem contas, sem compartilhamento com banda, sem multi-dispositivo | Crítico para diferencial: banda é contexto multi-pessoa |
| 3 | **Sem suporte a pedal Bluetooth** (AirTurn, PageFlip) — músico de mãos ocupadas não consegue virar página | Alto: table stakes em apps de performance |
| 4 | **Sem exportação** (PDF, backup, ChordPro) — dados ficam presos no SQLite; sem porta de saída, usuário não confia em investir catálogo | Alto: requisito de confiança e de uso analógico (imprimir para músico convidado) |
| 5 | **Cifra é texto puro renderizado** — sem destaque de acordes interativo, sem diagramas de acordes, sem "acordes simplificados", sem capo | Alto: é o coração do produto |
| 6 | **Sem anotações** (manuscritas ou de texto) sobre a cifra — marcações de dinâmica, "entra o solo aqui", setas | Alto no segmento de quem toca ao vivo |
| 7 | **Autoscroll rudimentar** (3 velocidades fixas) — sem teleprompter com duração calibrada por música, sem marcadores de seção | Médio-alto |
| 8 | **Sem player de referência** — só gravação própria; falta linkar/ouvir versão de referência (YouTube/Spotify/arquivo) durante ensaio | Médio-alto |
| 9 | **Estatísticas de ensaio superficiais** — não há visão temporal, streaks, evolução por música, heatmap de prática | Médio: engajamento/retensão |
| 10 | **Sem dark mode dedicado de palco** (fundo preto, acordes em cor de alto contraste, brilho) | Médio: detalhe que define "pro" |
| 11 | **Risco legal/robustez do scraping** do Cifra Club (quebra de layout, ToS, bloqueio) | Médio: fonte de instabilidade e risco jurídico |
| 12 | **Sem onboarding/nada "vazio" ajuda** — primeiro uso depende de importar ou digitar tudo | Médio: ativação |

### 1.3 Leitura estratégica

O ChordSet já cobre ~70% do "fluxo do músico solo organizado" (montar repertório → ensaiar → tocar ao vivo). Os gaps se concentram em **três eixos**:

1. **Confiabilidade no palco** (offline, pedal, legibilidade, teleprompter)
2. **Colaboração** (banda, compartilhamento, multi-user)
3. **Profundidade da cifra** (ChordPro nativo, diagramas, anotações, capo, export)

A vantagem competitiva potencial está no eixo **ensaio inteligente** (metrônomo + drum pad + stats + OCR), onde os concorrentes são fracos ou inexistentes.

---

## 2. Benchmark com apps líderes

### 2.1 OnSong (iOS, pago — referência de palco)
- **Tem e falta aqui:** formato ChordPro nativo como cidadão de primeira classe (conversor embutido); anotações manuscritas e highlights sobre o chart; sticky notes; **suporte total a pedais Bluetooth** (AirTurn etc.) com ações configuráveis; autoscroll com **duração por música** (calibrada) e seções; compartilhamento de sets e sincronização (OnSong Console, Dropbox/Google); export PDF paginado profissional; backing tracks com click; MIDI (troca de preset ao mudar de música); capo/variações de afinação; transposição por semitom com "transpose original".
- **O que não tem (abertura para nós):** ferramentas de ensaio/estudo fracas; sem metrônomo/drum patterns integrados de qualidade; fluxo de prática inexistente.

### 2.2 forScore (iOS, pago — referência de leitura)
- **Tem e falta aqui:** anotação manuscrita de altíssimo nível (Apple Pencil); crop/rearranjo de páginas; dark mode de palco; metrônomo visual; pedal page-turn; biblioteca com metadata rica (compositores, gêneros, duração); setlists com meia-página/links; sync cloud; export com anotações mescladas.
- **Foco é partitura em PDF**, não cifra com transposição — não concorrente direto em transposição, mas dono do padrão de UX de "ler música na tela".

### 2.3 Setlist Helper (Android/iOS, freemium)
- **Tem e falta aqui:** **sync de setlist com a banda em tempo real** (cada membro vê a mesma ordem e o tom, no próprio dispositivo); pedal Bluetooth; suporte a letras e ChordPro; catálogo offline nativo; attach de PDFs/imagens; contagem de vezes tocada.
- **O que não tem:** UX datada; sem transposição robusta; sem ensaio/prática; sem importação inteligente.

### 2.4 SongBook (Linkesoft)
- **Tem e falta aqui:** ChordPro + tabs com zoom automático; conversão automática de formatos; transpose incluindo instrumentos transpositores; autoscroll; sync via Dropbox/Google Drive/OneDrive; **export PDF com opções de layout**; link de música do YouTube por música; playlists/setlists compartilháveis via link.

### 2.5 Ultimate Guitar (freemium, escala massiva)
- **Tem e falta aqui:** catálogo licenciado gigante (oficial); "Pro" com tab interativa que toca; **simplificar acordes**; autoscroll; transpose; Tom/afinação alternativa; favoritos e histórico; offline para favoritos; comunidade/ratings de versões.
- **O que não tem:** nada de gestão de eventos, setlists de palco, ensaio, metrônomo — é catálogo, não ferramenta de performance. (Nosso scraping do Cifra Club tenta ser o "UG brasileiro", mas com risco legal — ver seção 4.)

### 2.6 Síntese do benchmark

| Feature | OnSong | forScore | Setlist Helper | SongBook | UG | **ChordSet hoje** |
|---|---|---|---|---|---|---|
| Offline-first | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pedal Bluetooth | ✅ | ✅ | ✅ | ✅ | parcial | ❌ |
| ChordPro nativo | ✅ | — | ✅ | ✅ | ✅ | ⚠️ conversor interno |
| Anotações | ✅ | ✅ | ❌ | parcial | ❌ | ❌ |
| Export PDF | ✅ | ✅ | parcial | ✅ | ❌ | ❌ |
| Sync/compartilha banda | ✅ | parcial | ✅ | ✅ | ❌ | ❌ |
| Teleprompter/autoscroll calibrado | ✅ | parcial | parcial | ✅ | ✅ | ⚠️ 3 velocidades |
| Metrônomo/drum patterns | parcial | ✅ | ❌ | ❌ | ❌ | ✅ **diferencial** |
| Ensaio/prática com stats | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **diferencial** |
| OCR/import por foto | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **diferencial** |
| Transposição | ✅ | — | parcial | ✅ | ✅ | ✅ |

**Conclusão:** o ChordSet é fraco nos "table stakes de palco" (offline, pedal, PDF, sync) e forte/único no "ciclo de ensaio" (prática, metrônomo, ritmos, OCR). A estratégia deve ser: **fechar os table stakes rápido (Onda 1) e depois investir onde ninguém compete (ensaios inteligentes)**.

---

## 3. Proposta de features em 3 ondas

### Onda 1 — Quick wins de alto impacto (0–3 meses) — "confiável no palco"

Critério: alto impacto percebido, esforço moderado, sem mudar o modelo de dados profundamente.

1. **PWA offline-first** ⭐ maior prioridade
   - Service worker + cache do repertório do evento ativo; "Modo Palco" que pré-baixa o setlist inteiro ao abrir o evento
   - IndexedDB no cliente como espelho de leitura; sync best-effort
   - Manifest + instalação na home (hoje é só uma página web)
   - *Por quê:* elimina o gap #1 — o músico nunca mais fica sem cifra por falta de rede.
2. **Pedal Bluetooth page-turn**
   - Mapear eventos de teclado HID (PageUp/PageDown/setas — é assim que AirTurn/PageFlip aparecem) no modo performance
   - Ações configuráveis: próxima música, scroll página, toggle autoscroll
   - *Esforço baixo* (listener de keydown) e *impacto altíssimo* para quem toca.
3. **Export PDF** (música e setlist inteiro)
   - Server-side (ex.: render de template HTML → PDF) com layout de 1 coluna, tom escolhido, diagramas opcionais depois
   - "Imprimir setlist do evento" cobre o caso do músico convidado.
4. **Backup/Export-Import de dados** (JSON/ChordPro zip)
   - Export completo do banco + import; dá confiança e destrava migração entre instâncias Docker.
5. **Dark mode de palco** + temas de leitura (papel, sépia, alto contraste) e controle de brilho in-app.
6. **Teleprompter melhorado**: duração calibrada por música (o app aprende/aproxima pelo BPM e nº de linhas), marcadores de seção (Intro/Verso/Refrão) clicáveis, "pedalar" = avança seção.
7. **Player de referência por música**: campo de link (YouTube/Spotify) com embed, além do áudio já gravado; ouvir a referência no ensaio sem sair do app.
8. **Diagramas de acordes** (violão) na cifra: biblioteca estática de diagramas por acorde detectado; toggle "mostrar acordes desconhecidos".
9. **Onboarding vazio feliz**: importar demo setlist + 5 músicas exemplo + tour de 3 telas.

### Onda 2 — Diferenciais competitivos (3–9 meses) — "a banda inteira no app"

1. **Multi-usuário + bandas** (auth real: e-mail/magic link)
   - Contas, convite para banda por link, papéis (líder/músico)
   - Migração do Basic Auth preservando instância single-user self-hosted como opção
2. **Sincronização de setlist ao vivo** (modo "Palco Conectado")
   - WebSocket/SSE: líder avança música/página → todos os dispositivos da banda seguem; tom exibido por instrumento (cada um com sua transposição — ex.: sax em Bb)
   - *Diferencial direto contra Setlist Helper com UX moderna.*
3. **ChordPro como formato nativo de armazenamento**
   - Parser/renderer único (já há conversor), diretivas (`{title}`, `{key}`, `{capo}`, seções), suporte a tabs, import/export `.cho`/`.chordpro`
   - Habilita tudo: capo, simplificação, export bonito.
4. **Anotações** (fase 1: notas de texto ancoradas por linha + highlights coloridos; fase 2: manuscritas com canvas/Pencil)
5. **Capo & transposição inteligente**: "capo 3", preferência de acordes fáceis, detecção de acordes difíceis com sugestão de voicing.
6. **Estatísticas de ensaio v2**: streaks, heatmap semanal, evolução por música (tempo → status), "repertório pronto para o show X%" baseado nos status; relatório semanal.
7. **Modo teleprompter dedicado** para vocalista (só letra, fonte gigante, seções).
8. **Biblioteca de backing tracks/click**: associar áudio de referência com metrônomo sincronizado (BPM já existe por música).
9. **Busca global e filtros avançados** (por tag, tom, "tocadas no último ano", duração estimada do repertório).

### Onda 3 — Visão de longo prazo (9+ meses) — "plataforma do músico brasileiro"

1. **Catálogo licenciado / parcerias** em vez de scraping (Cifra Club API oficial se existir acordo, ou catálogo próprio crowd-sourced com moderação)
2. **Apps nativos ou wrappers** (Capacitor) para App Store/Play com Bluetooth BLE de pedal dedicado e haptics
3. **IA de ensaio**: análise do áudio gravado no ensaio (detectar BPM real vs. alvo, estabilidade do tempo), sugestão de próximas músicas a praticar, detecção automática de tom por áudio
4. **Marketplace/sharing comunitário** de templates de repertório (casamento, barzinho, missa) com curadoria
5. **Integrações**: Spotify/Apple Music playlists → setlist; YouTube Music; importação de histórico do UG/Cifra Club
6. **Colaboração assíncrona**: comentários por música no evento ("baixar meio tom", "entrar depois do 2º refrão"), versões de cifra com histórico
7. **Modo igreja/liturgia** e outros nichos verticais (templates, campos específicos) — apenas se houver tração
8. **MIDI** (troca de presets de pedal/teclado ao mudar de música) — nicho pro, esforço alto

### Critérios de priorização usados
- Frequência do cenário de uso (palco > ensaio > organização)
- Dor × esforço (Onda 1 maximiza razão)
- Defensabilidade (Onda 2/3 constroem fosso: colaboração + dados de prática + IA)
- Dependências técnicas (ChordPro nativo antes de capo/anotações ricas; auth antes de sync)

---

## 4. Riscos e o que NÃO fazer

### Riscos

1. **Legal — scraping do Cifra Club.** É a principal fonte de conteúdo e também o maior risco: violação de ToS, fragilidade a mudanças de layout (Playwright + Cheerio quebram), exposição a bloqueio de IP e, em escala, risco jurídico real (cifras têm direitos autorais). **Mitigação:** tratar importação como "importar do que o usuário já tem direito" (foto, paste, arquivo ChordPro), nunca redistribuir catálogo; monitorar e isolar o scraper atrás de feature flag; buscar parceria/licenciamento na Onda 3.
2. **Escopo de plataforma.** Pular de "app self-hosted single-user" para "SaaS multi-tenant com sync em tempo real" é o salto mais arriscado do roadmap. **Mitigação:** fazer auth + bandas como feature opcional; manter modo single-user funcionando (é o público atual e o diferencial self-hosted é charme do produto).
3. **Offline-first mal feito = perda de dados.** Sync de SQLite/IndexedDB com conflitos é fácil de errar. **Mitigação:** Onda 1 é *read-only offline* (espelho de leitura); escrita offline só na Onda 2 com estratégia clara (last-write-wins por campo ou CRDT só onde vale).
4. **Complexidade de formato.** ChordPro nativo exige migrar cifras legadas em texto-espaçado; conversão automática erra em tabs e marcações. **Mitigação:** manter render de texto como fallback; conversão assistida com preview (o app já tem o conversor).
5. **Feature creep de nicho.** MIDI, backing tracks, igreja — cada um é um produto. Só entram com evidência de demanda.
6. **App Store.** Cifras/licenças podem complicar aprovação; wrappers nativos adicionam custo de manutenção desproporcional cedo demais.
7. **OCR por LLM em produção** ainda não testado (marcado como pendente no PROGRESS) — custo variável e latência; precisa de limites e fallback entre providers.

### O que NÃO fazer (agora)

- ❌ **Não construir rede social / feed / comunidade.** UG já é a rede social das cifras; não é nossa batalha.
- ❌ **Não virar editor de partituras** (notação pentagrama) — forScore/MuseScore dominam; escopo infinito.
- ❌ **Não fazer app nativo do zero antes da Onda 3** — PWA + Capacitor depois é 10% do custo.
- ❌ **Não perseguir catálogo próprio de cifras** antes de resolver licenciamento — risco legal sem retorno.
- ❌ **Não adicionar gravação multitrack / DAW features** — fora do foco "cifra → ensaio → palco".
- ❌ **Não implementar sync offline escrito na Onda 1** — read-only primeiro.
- ❌ **Não cobrar antes de fechar os table stakes** — ninguém paga por app de palco que falha offline.
- ❌ **Não remover o modo self-hosted/Basic Auth** ao introduzir SaaS — é diferencial e base de usuários atual.

---

## Apêndice A — Métricas de produto sugeridas

- **Ativação:** % de novos usuários com 1 evento + 5 músicas importadas na 1ª sessão
- **Confiança no palco:** % de sessões de performance em modo offline; crashes no modo performance
- **Engajamento de ensaio:** sessões de prática/semana/usuário; streak médio
- **Banda:** % de eventos com 2+ dispositivos conectados (Onda 2)
- **Retenção:** D30/D90 por coorte de instalação

## Apêndice B — Dependências técnicas relevantes (do código atual)

- `src/utils/chordpro-converter.ts` já existe → base para ChordPro nativo (Onda 2.3)
- `src/utils/chord-transposer.ts` engine única com testes → transposição por instrumento (Onda 2.2) é evolução natural
- `bpm`/`volume`/`drum_pattern_id` por música já no schema → click track/backing (Onda 2.8) quase sem migration
- `PracticeStats` e `practice-utils.ts` → estatísticas v2 é extensão, não rewrite
- Wake Lock + fullscreen já prontos → pedal e teleprompter plugam no modo performance existente
