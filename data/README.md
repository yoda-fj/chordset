# Schema do Banco de Dados - Chordset

Este documento descreve o schema do banco de dados SQLite usado pela aplicação Chordset.

## Localização do Banco

- **Arquivo**: `data/chordset.db`
- **Engine**: SQLite 3
- **WAL Mode**: Habilitado para melhor performance

## Tabelas

### 1. musicas

Armazena as músicas cadastradas no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | ID único da música |
| titulo | TEXT NOT NULL | Título da música |
| artista | TEXT NOT NULL | Nome do artista/banda |
| tom_original | TEXT | Tom original da música (ex: C, Dm, G) |
| cifra | TEXT | Cifra completa da música |
| tags | TEXT DEFAULT '[]' | Array JSON de tags |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Data de criação |
| updated_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Índices:**
- `idx_musicas_titulo` - Para busca por título
- `idx_musicas_artista` - Para busca por artista

### 2. templates

Templates de eventos para criar eventos padronizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | ID único do template |
| nome | TEXT NOT NULL | Nome do template |
| descricao | TEXT | Descrição do template |
| tags | TEXT DEFAULT '[]' | Array JSON de tags padrão |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Data de criação |

### 3. eventos

Armazena os eventos/cultos cadastrados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | ID único do evento |
| nome | TEXT NOT NULL | Nome do evento |
| data | DATE NOT NULL | Data do evento (YYYY-MM-DD) |
| hora | TIME | Hora do evento (HH:MM:SS) |
| local | TEXT | Local onde será realizado |
| status | TEXT DEFAULT 'rascunho' | Status: rascunho, confirmado, realizado, cancelado |
| template_id | INTEGER | FK para templates (opcional) |
| tags | TEXT DEFAULT '[]' | Array JSON de tags |
| observacoes | TEXT | Observações adicionais |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Data de criação |
| updated_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Índices:**
- `idx_eventos_data` - Para ordenação por data
- `idx_eventos_status` - Para filtragem por status

**Foreign Keys:**
- `template_id` → `templates(id)`

### 4. setlists

Relaciona músicas aos eventos (setlist do evento).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | ID único |
| evento_id | INTEGER NOT NULL | FK para eventos |
| musica_id | INTEGER NOT NULL | FK para musicas |
| ordem | INTEGER NOT NULL | Ordem da música no setlist |
| tom_evento | TEXT | Tom específico para este evento |
| observacoes | TEXT | Observações da música no evento |

**Índices:**
- `idx_setlists_evento` - Para buscar músicas de um evento

**Foreign Keys:**
- `evento_id` → `eventos(id)` ON DELETE CASCADE
- `musica_id` → `musicas(id)` ON DELETE CASCADE

## Status de Eventos

- `rascunho` - Evento em planejamento
- `confirmado` - Evento confirmado
- `realizado` - Evento já realizado
- `cancelado` - Evento cancelado

## Notas

- As tags são armazenadas como JSON arrays na forma `["tag1", "tag2"]`
- O banco usa WAL (Write-Ahead Logging) para melhor performance em aplicações multi-thread
- Todas as tabelas têm índices nas colunas mais consultadas
