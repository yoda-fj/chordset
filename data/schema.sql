-- Schema do banco de dados Chordset (SQLite)

-- Tabela de Ritmos de Bateria (Drum Patterns) - criar ANTES de musicas
CREATE TABLE IF NOT EXISTS drum_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  bpm INTEGER DEFAULT 120,
  kit TEXT DEFAULT 'kit1', -- kit1, kit2, etc
  steps TEXT NOT NULL DEFAULT '[]', -- JSON array: [[kick],[snare],...] por step
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Músicas
CREATE TABLE IF NOT EXISTS musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL,
  tom_original TEXT,
  cifra TEXT,
  tags TEXT DEFAULT '[]', -- JSON array de tags
  observacao TEXT, -- Observação livre do usuário
  audio_url TEXT, -- URL/caminho para gravação de áudio de referência
  groove TEXT, -- JSON com padrão de bateria (groove) para a música
  drum_pattern_id INTEGER, -- FK para drum_patterns (ritmo associado)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drum_pattern_id) REFERENCES drum_patterns(id) ON DELETE SET NULL
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
  data DATE,
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

-- Tabela de Sessões de Ensaio (Prática)
CREATE TABLE IF NOT EXISTS practice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  musica_id INTEGER NOT NULL,
  status TEXT DEFAULT 'needs_practice', -- needs_practice, practiced, mastered
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  total_practice_time_seconds INTEGER DEFAULT 0,
  last_practiced_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (musica_id) REFERENCES musicas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_musica ON practice_sessions(musica_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);
