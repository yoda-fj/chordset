-- Schema do banco de dados Chordset (SQLite)

-- Tabela de Músicas
CREATE TABLE IF NOT EXISTS musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL,
  tom_original TEXT,
  cifra TEXT,
  tags TEXT DEFAULT '[]', -- JSON array de tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Templates de Evento
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  tags TEXT DEFAULT '[]', -- JSON array de tags padrão
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Músicas em Templates
CREATE TABLE IF NOT EXISTS template_musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  musica_id INTEGER NOT NULL,
  ordem INTEGER NOT NULL,
  tom_sugerido TEXT,
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (musica_id) REFERENCES musicas(id) ON DELETE CASCADE
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME,
  local TEXT,
  status TEXT DEFAULT 'rascunho', -- rascunho, confirmado, realizado, cancelado
  template_id INTEGER,
  tags TEXT DEFAULT '[]', -- JSON array de tags
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Tabela de Músicas em Eventos (Setlists)
CREATE TABLE IF NOT EXISTS evento_musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento_id INTEGER NOT NULL,
  musica_id INTEGER NOT NULL,
  ordem INTEGER NOT NULL,
  tom_evento TEXT,
  observacoes TEXT,
  confirmada INTEGER DEFAULT 0, -- boolean (0 ou 1)
  responsavel TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (musica_id) REFERENCES musicas(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_musicas_titulo ON musicas(titulo);
CREATE INDEX IF NOT EXISTS idx_musicas_artista ON musicas(artista);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);
CREATE INDEX IF NOT EXISTS idx_evento_musicas_evento ON evento_musicas(evento_id);
CREATE INDEX IF NOT EXISTS idx_template_musicas_template ON template_musicas(template_id);
