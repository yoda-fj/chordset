-- Migration: Add bpm and volume columns to musicas table for drum pad persistence

ALTER TABLE musicas ADD COLUMN bpm INTEGER DEFAULT 120;
ALTER TABLE musicas ADD COLUMN volume REAL DEFAULT 0.7;
