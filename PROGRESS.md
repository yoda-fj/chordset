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

## 🔧 Pending / Bugs

### Bug Conhecido
- [ ] /eventos/new não carrega no Coolify (HTTP 200 mas "This page couldn't load") - possivelmente Docker cache ou Next.js build issue

### Para Implementar
- [ ] Seção de Ensaios (ensaios page.tsx) - currently mock data, sem API real
- [ ] Persistent storage pro SQLite no Coolify
- [ ] Testar reorder no mobile após DragOverlay fix

## 📋 Configuração

### Variáveis de Ambiente (.env)
```
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=senha
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
