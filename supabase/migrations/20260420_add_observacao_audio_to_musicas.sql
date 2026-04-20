-- Migration: Adicionar campos observacao e audio_url na tabela musicas
-- Data: 2026-04-20

ALTER TABLE musicas ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS audio_url TEXT;