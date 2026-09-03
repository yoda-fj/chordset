# Auditoria UX/UI #01 — ChordSet

**Data:** 2026-09-03 · **Escopo:** `src/app`, `src/components`, `tailwind.config.ts`, `globals.css`
**Método:** análise estática completa do código + build de produção (`npm run build` ✅) + servidor local (`next start -p 3738`, páginas respondendo 200, HTML renderizado inspecionado via curl). A inspeção interativa em navegador foi bloqueada pela aprovação manual de remote debugging do Chrome neste ambiente; as conclusões abaixo derivam do código e do HTML servido, que espelha fielmente o que o usuário vê.

---

## 1. Diagnóstico — por que a interface parece "simples demais"

### 1.1 Não existe design system
- `tailwind.config.ts` está **vazio** (`theme: { extend: {} }`, zero plugins). Não há tokens de cor, tipografia, espaçamento, sombras, raios ou motion. Tudo é paleta default do Tailwind aplicada ad hoc.
- Cores de marca inconsistentes: o app inteiro usa `indigo-600` como cor primária (`layout.tsx`, `musicas/page.tsx`, `eventos/page.tsx`, `ensaios/page.tsx`), mas `ritmos/page.tsx` usa `blue-600` — duas "cores primárias" convivendo.
- Cores semânticas hardcoded espalhadas (`green-100`, `amber-100`, `emerald-100`, `red-500`…) sem tokens semânticos (`success`, `warning`, `danger`). Impossível re-temar o app sem caçar centenas de classes.
- Classes utilitárias gigantes repetidas em todo card/botão (ex.: o botão primário `px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700` aparece literalmente em 5+ páginas). Não existe `<Button>`, `<Card>`, `<Badge>`, `<Input>` — só `Toast.tsx` em `components/ui/`.

### 1.2 Tema claro forçado — o oposto do que um palco precisa
- `layout.tsx:22` fixa `bg-gray-50` no app inteiro e `bg-white` na nav. Não há `darkMode` configurado no Tailwind nem toggle de tema.
- As únicas classes `dark:` do projeto estão em `ChordViewer.tsx` (14) e `ImportPhotoModal.tsx` (19) e dependem de `prefers-color-scheme` do SO — ou seja, o viewer de cifra pode ficar escuro **dentro de uma página clara**, gerando uma experiência frankenstein. O restante do app ignora dark mode completamente.
- Para uso **ao vivo no palco** (ambiente escuro, tablet no pedestal, luz de palco variável), fundo branco é o erro #1: estoura a visão do músico e vira um holofote no palco.

### 1.3 Tipografia subdimensionada e sem hierarquia de performance
- Uma única fonte: Inter (`layout.tsx:7`). Não há fonte mono dedicada para cifras (usa `font-mono` default do Tailwind) nem fonte display para títulos.
- Cifra renderiza com **16px por padrão e teto de 28px** (`CifraViewer.tsx:64,146`). Lendo a 1–2 m de distância num pedestal, o mínimo confortável é ~20–24px e o teto deveria chegar a 48–64px.
- `ChordViewer.tsx` mistura tamanhos fixos: acordes sempre `text-sm` (14px) e letra sempre `text-sm` independente do `fontSize` escolhido no modo ChordPro (linhas 335 e 344) — o controle de zoom **não escala acordes nem letra no formato principal**, apenas o container. E o posicionamento usa `CHAR_WIDTH = 8.5` px fixo (linha 327): ao mudar a fonte, os acordes **desalinham da letra**. Bug funcional de UX crítico para o uso real.
- Corpo de texto em `text-gray-500`/`text-gray-600` (contraste ~4.6:1 sobre branco) e muito `text-xs` em badges/tags — abaixo do recomendado para leitura em movimento.

### 1.4 Alvos de toque minúsculos para uso com dedos no palco
- Barra de controles do `CifraViewer.tsx`: ícones `w-4 h-4` com `p-1.5` → alvos de ~28×28px (linhas 104, 139, 148, 156, 172). A recomendação mínima (Apple HIG / WCAG 2.5.8) é 44×44px; para palco, 48–56px.
- Transposição de tom é um `<select>` nativo minúsculo (`CifraViewer.tsx:123`) — péssimo com dedos, sem feedback visual do tamanho do tom atual. Deveria ser stepper `− TOM +` gigante.
- Navegação entre músicas da setlist (anterior/próxima/concluir) fica **escondida dentro da sidebar** (`eventos/[id]/setlist/page.tsx:217-239`) e em mobile essa sidebar é um overlay fechado por padrão — no palco, a ação mais importante (próxima música) exige abrir um menu.

### 1.5 Falta de modo "Performance" dedicado
- A página de setlist ao vivo (`eventos/[id]/setlist/page.tsx`) é a mesma UI administrativa: header branco com `X` de 20px, sidebar clara, painel direito de observações/áudio disputando espaço. Existe Wake Lock (bom!) e fullscreen, mas:
  - Sem gestos: não há swipe horizontal para trocar de música nem pinch para zoom (só `touchAction: 'pan-y'` no scroll).
  - Sem atalhos de teclado (setas, espaço para autoscroll) — essencial para pedal/page-turner Bluetooth, que emula teclas.
  - Sem auto-hide dos controles; a barra de controles clara fica permanentemente sobre a cifra.
  - Sem indicador de progresso persistente do autoscroll (o `progress` existe em `Autoscroll.tsx` mas a UI é mínima).
  - Metrônomo (`Metronome.tsx`) é só áudio — sem flash visual de pulso, indispensável em palco barulhento.
- Sidebar da setlist some em telas < lg (`hidden lg:block`, linha 214) — sem modo tablet intermediário.

### 1.6 Micro-interações e motion praticamente inexistentes
- `globals.css` tem **um único** keyframe (`slide-in`, usado só no Toast). O resto é `transition-colors`/`hover:shadow-md` esporádico.
- Sem transições de página, sem `layoutId`/shared-element, sem spring physics, sem feedback de `active:scale` nos botões, sem skeletons — loading é spinner `Loader2` ou texto "Carregando..." (`ritmos/page.tsx:139`).
- Sem haptics (`navigator.vibrate`) em ações-chave mobile.
- Confirmações destrutivas usam `confirm()`/`alert()` nativos (`ritmos/page.tsx:121,126`) — quebram qualquer sensação de produto polido.

### 1.7 Navegação e identidade
- Navbar é desktop-only (`layout.tsx`): 5 links de texto sem ícones, sem indicador de página ativa, sem versão mobile (em telas pequenas os links simplesmente apertam/quebram). Sem bottom tab bar — padrão obrigatório para app usado em pé com uma mão.
- Branding confuso: o app se chama ChordSet, mas título/logo dizem "Setlist Tools" (`layout.tsx:10,28`, `page.tsx:7`).
- `public/` não tem favicon, manifest nem ícones — sem PWA instalável, o que seria quase obrigatório para uso em tablet no palco (tela cheia, offline).
- Homepage (`page.tsx`) é um hero genérico com 2 botões; zero personalidade, zero atalho para "começar show agora" (a ação mais valiosa do produto).

### 1.8 Acessibilidade e robustez
- Botões de ícone puro sem `aria-label` (só `title`, que não é anunciado de forma confiável) em toda a barra do `CifraViewer` e na setlist.
- Sem `:focus-visible` styles customizados; navegação por teclado invisível.
- Sem `prefers-reduced-motion` (relevante ao adicionar animações).
- Estados de erro/empty inconsistentes entre páginas (alguns com botão de retry, outros sem).
- O que já está bom: CSS de impressão da cifra (`globals.css`), Wake Lock na setlist, fullscreen que esconde a nav, toasts com auto-dismiss.

---

## 2. Proposta de direção "triple A" — ChordSet como instrumento de palco

Princípio norteador: **o app tem dois modos de vida** — *Backstage* (gerenciar músicas, eventos, ensaios — denso, eficiente) e *Stage* (executar a setlist — escuro, enorme, gestual, à prova de erro). O design system deve servir aos dois, com o modo Stage como assinatura visual.

### 2.1 Design tokens (fundação)
Preencher `tailwind.config.ts` com tokens semânticos via CSS variables:

```ts
// tailwind.config.ts (direção)
theme: {
  extend: {
    colors: {
      surface:  { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', raised: '...', overlay: '...' },
      ink:      { DEFAULT: '...', muted: '...', faint: '...' },
      brand:    { ...escala âmbar de palco, ex: #FFB020 → #FFD57A },
      chord:    '#34D399',  // acordes (verde "go")
      section:  '#A78BFA',  // cabeçalhos de seção
      tab:      '#FBBF24',  // tablatura
      danger:   '#F87171', success: '#34D399',
    },
    fontFamily: {
      sans:    ['"Instrument Sans"', 'system-ui'],
      display: ['"Space Grotesk"', 'sans-serif'],   // títulos / números grandes
      chord:   ['"JetBrains Mono"', 'monospace'],   // cifras e tabs
    },
    fontSize: { 'stage-sm': ['20px', '1.6'], 'stage-md': ['28px', '1.5'], 'stage-lg': ['40px', '1.3'], 'stage-xl': ['64px', '1.1'] },
    borderRadius: { xl2: '1rem' },
    transitionTimingFunction: { spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  }
}
```
- Dark-first: `darkMode: 'class'` + `next-themes`, com o **modo Stage fixo em `zinc-950`/preto puro (OLED)** e contraste de texto ≥ 7:1 (WCAG AAA). O claro vira exceção para impressão/admin.
- Acento de marca: âmbar quente (#FFB020) — leitura excelente no escuro, evoca luz de palco e não conflita com verde de "concluído".

### 2.2 Tipografia para leitura à distância
- Cifra: mínimo 20px, default 24–28px, teto 64px; acordes em peso 700 com cor própria (`chord`), line-height generoso.
- Corrigir o `ChordViewer`: abandonar `CHAR_WIDTH` absoluto — usar layout em **duas linhas empilhadas por sílaba** (spans inline com acorde sobre a sílaba, padrão do chordprojs / ChordSheetJS) ou medir `ch` reais via `ch` units/CSS `font-size-adjust`. Assim o zoom nunca desalinha.
- Título da música atual sempre visível em `stage-lg` no modo Stage, com "3/12 · próxima: Nome da Música" em `stage-sm`.

### 2.3 Modo Stage (a tela-assinatura)
Reescrever `eventos/[id]/setlist/page.tsx` como experiência imersiva:
- **Chrome que desaparece:** header/controles com auto-hide após 3s de inatividade (`framer-motion` `AnimatePresence`), reaparecendo a qualquer toque; fullscreen + Wake Lock automáticos ao entrar.
- **Gestos (`@use-gesture/react` + `framer-motion`):** swipe horizontal muda de música com shared-element transition; pinch ajusta fonte; dois dedos tocam/pausam autoscroll; long-press marca como concluída.
- **Pedal/teclado (`react-hotkeys-hook`):** `→/↓` próxima, `←/↑` anterior, `espaço` autoscroll, `F` fullscreen, `+/-` tom. Compatível com pedais Bluetooth (AirTurn etc.).
- **Tom com steppers gigantes:** `− [ G ] +` em botões ≥64px, com animação de flip no dígito.
- **Metrônomo visual:** flash de borda/barra superior sincronizado com o `Tone.Transport` (já existe o engine), mais tap-tempo.
- **Barra de progresso da música:** fina no topo, ligada ao `progress` do autoscroll.
- **Ação primária sempre à mão:** botão flutuante "Próxima música ▶" (72px, âmbar) no canto inferior direito, com haptic (`navigator.vibrate(10)`).
- Tela "entre músicas": count-in opcional 4 tempos + cartão enorme com título/tom/BPM da próxima.

### 2.4 Navegação e shell
- Bottom tab bar mobile (Músicas, Eventos, Ritmos, Ensaios) com pill animada via `framer-motion` `layoutId`; navbar desktop ganha indicador de rota ativa (`usePathname`).
- Corrigir branding: "ChordSet" no `metadata`, logo próprio, favicon + `manifest.webmanifest` + ícones → **PWA instalável** (next-pwa ou metadata API do Next 16), service worker com cache das cifras do evento ativo para **uso offline no palco** (SQLite local já ajuda).
- Command palette (`cmdk`, atalho `⌘K`): "ir para música", "transpor", "abrir setlist de hoje" — diferencial triple A real em app de repertório grande.

### 2.5 Componentização (design system de verdade)
Criar `components/ui/` completo com **CVA (`class-variance-authority`) + `tailwind-merge` + primitivos Radix UI**:
`Button` (variants: primary/ghost/danger; sizes até `stage`), `Badge`, `Card`, `Input`, `Select` (Radix, não nativo), `Sheet` (drawer mobile, ou `vaul`), `Dialog` (substituir todos os `confirm()/alert()`), `Skeleton`, `SegmentedControl` (filtros de ensaios), `Tabs`. Trocar o Toast caseiro por **`sonner`** (ou manter o provider mas com o visual novo).

### 2.6 Micro-interações e motion
- `framer-motion` em: entrada de listas com stagger, press feedback `whileTap={{ scale: 0.97 }}`, transições de página suaves, números de BPM/tom com spring, confirmação de "música concluída" com check animado.
- Loading: skeletons no lugar de spinners; empty states com ilustração e CTA duplo.
- Sempre respeitar `prefers-reduced-motion` (media query global desligando springs).

### 2.7 Acessibilidade como requisito de palco
- Todos os alvos de toque ≥ 48px; `aria-label` em todo botão de ícone; `focus-visible` ring visível; `role="tablist"` na bottom nav; anúncios `aria-live` para "música 3 de 12".
- Contraste validado (AAA no modo Stage); teste com óculos escuros/brilho de palco como cenário de QA.

### 2.8 Roadmap sugerido
1. **Fundação (1–2 dias):** tokens no Tailwind, next-themes dark-first, fontes, CVA + Button/Badge/Card, corrigir branding e `dark:` órfãs.
2. **Cifra (2–3 dias):** reescrever alinhamento acorde/sílaba, escala tipográfica de palco, stepper de tom, metrônomo visual.
3. **Modo Stage (3–5 dias):** gestos, hotkeys/pedal, auto-hide chrome, botão próxima música, PWA offline.
4. **Polimento (contínuo):** framer-motion global, cmdk, sonner, skeletons, Dialogs Radix, auditoria a11y.

**Stack de apoio a adicionar:** `framer-motion`, `@use-gesture/react`, `react-hotkeys-hook`, `cmdk`, `sonner`, `next-themes`, `class-variance-authority` + `tailwind-merge` + `clsx`, `@radix-ui/*` (dialog, select, tabs, slider), `vaul` (drawer), fontes `Space Grotesk` + `Instrument Sans` + `JetBrains Mono` via `next/font/google`.
