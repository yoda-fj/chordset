#!/usr/bin/env python3
"""Collect unique hardcoded color classes in Backstage files."""
import re, sys, os

ROOT = '/Users/yoda/Work/projects/chordset'
FILES = [
    'src/app/page.tsx',
    'src/app/eventos/page.tsx',
    'src/app/eventos/new/page.tsx',
    'src/app/eventos/[id]/page.tsx',
    'src/app/eventos/[id]/editar/page.tsx',
    'src/app/musicas/page.tsx',
    'src/app/musicas/new/page.tsx',
    'src/app/musicas/[id]/page.tsx',
    'src/app/musicas/[id]/edit/page.tsx',
    'src/app/templates/page.tsx',
    'src/app/templates/new/page.tsx',
    'src/app/templates/[id]/page.tsx',
    'src/app/ensaios/page.tsx',
    'src/app/ensaios/new/page.tsx',
    'src/app/ensaios/[id]/page.tsx',
    'src/app/ritmos/page.tsx',
    'src/app/ritmos/[id]/page.tsx',
    'src/components/ui/Toast.tsx',
    'src/components/practice/PracticeCard.tsx',
    'src/components/practice/PracticeTimer.tsx',
    'src/components/practice/PracticeStats.tsx',
    'src/components/setlist/MusicaCard.tsx',
    'src/components/setlist/TagInput.tsx',
    'src/components/setlist/SetlistBuilder.tsx',
    'src/components/cifraclub/VersionSelector.tsx',
    'src/components/audio/AudioRecorderPanel.tsx',
    'src/components/ocr/ImportPhotoModal.tsx',
]

# class-like tokens containing a color family
PAT = re.compile(
    r'(?<![\w/-])(?:[\w-]+:)*[\w-]*(?:bg|text|border|ring|divide|from|to|via|placeholder|shadow|outline|decoration|accent|caret|fill|stroke)'
    r'-(?:gray|white|black|indigo|blue|red|green|yellow|amber|emerald|purple|violet|zinc|slate|orange|rose|pink|cyan|sky|teal|lime|fuchsia|neutral|stone)'
    r'(?:-\d{2,3})?(?![\w-])'
)
PAT2 = re.compile(r'(?<![\w/-])(?:[\w-]+:)*(?:bg|text)-(?:white|black)(?![\w-])')

uniq = {}
for f in FILES:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
        print('MISSING', f); continue
    txt = open(p).read()
    for m in list(PAT.finditer(txt)) + list(PAT2.finditer(txt)):
        uniq.setdefault(m.group(0), set()).add(f)

for tok in sorted(uniq):
    print(f'{tok:45s} {len(uniq[tok]):2d} files')
print('TOTAL unique tokens:', len(uniq))
