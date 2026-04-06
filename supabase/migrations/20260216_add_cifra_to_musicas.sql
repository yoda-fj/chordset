-- Migration: Adicionar campo cifra na tabela musicas
-- Data: 2026-02-16

-- Adiciona coluna cifra como TEXT (opcional)
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS cifra TEXT;

-- Comentário para documentação
COMMENT ON COLUMN musicas.cifra IS 'Cifra completa da música (letra + acordes)';
