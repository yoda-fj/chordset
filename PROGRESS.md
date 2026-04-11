# ChordSet - Progresso e Features

## 🚀 Funcionalidades Implementadas

### Core
- [x] CRUD de Músicas (com tags, tom, cifra)
- [x] CRUD de Templates (listas de música reutilizáveis)
- [x] CRUD de Eventos (com repertório)
- [x] Modo Performance/Setlist (para tocar ao vivo)
- [x] Transposição de tom em tempo real
- [x] Wake Lock API (mantém tela acesa no mobile)
- [x] Scroll speed control (⏹ → 1x → 2x → 3x)
- [x] Fullscreen mode
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

## 📝 Notas

- Build de produção: `next start` (não `next dev`) para evitar WebSocket errors no acesso via rede
- Basic Auth protege todas as rotas via src/middleware.ts
- Study list: evento com `data = null` no banco
- Para acesso via rede local: next.config.js com `allowedDevOrigins: ['192.168.15.3', '192.168.15.4']`
