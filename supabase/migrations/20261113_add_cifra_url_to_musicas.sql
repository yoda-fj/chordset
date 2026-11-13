-- Migration: Add cifra_url column to musicas table (URL de origem da cifra importada)

ALTER TABLE musicas ADD COLUMN cifra_url TEXT;
