-- Seed data: Ritmos de bateria básicos pré-definidos
-- Grid de 16 steps (semínimas)
-- Instrumentos: kick, snare, hihatClosed, hihatOpen, crash, ride, tomLow, tomMid, tomHigh

INSERT INTO drum_patterns (nome, bpm, kit, steps) VALUES
-- 1. Rock Básico (4/4)
('Rock Básico', 120, 'kit1', '[
  [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
  [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 2. Funk Groove
('Funk Groove', 110, 'kit1', '[
  [true,false,false,true,false,false,true,false,true,false,false,false,true,false,true,false],
  [false,false,true,false,false,true,false,false,false,false,true,false,false,true,false,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 3. Disco / Four-on-the-floor
('Disco Beat', 128, 'kit1', '[
  [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 4. Bossa Nova
('Bossa Nova', 100, 'kit1', '[
  [false,false,true,false,false,false,false,false,false,false,true,false,false,false,false,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 5. Samba Enredo
('Samba Enredo', 130, 'kit1', '[
  [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
  [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 6. Reggae (One Drop)
('Reggae One Drop', 85, 'kit1', '[
  [true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 7. Pop Ballad
('Pop Ballad', 72, 'kit1', '[
  [true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 8. Jazz Brush (Ride + Kick + Snare)
('Jazz Brush', 140, 'kit1', '[
  [true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 9. Heavy Metal (Double Bass)
('Heavy Metal', 160, 'kit1', '[
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]'),

-- 10. Shuffle Blues
('Shuffle Blues', 100, 'kit1', '[
  [true,false,false,false,false,false,true,false,true,false,false,false,false,false,true,false],
  [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
  [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
]');
