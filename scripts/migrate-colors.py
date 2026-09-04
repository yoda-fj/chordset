#!/usr/bin/env python3
"""Migra classes de cor hardcoded do Backstage para tokens semanticos (Fase 1.2).

Substitui o "core" da classe (ex.: bg-indigo-600) preservando variantes
(hover:, focus:, dark:, sm:...). NAO toca chords/, cifra/ nem setlist.
"""
import os
import re
import sys

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

# core (sem variante) -> novo core
CORE = {
    # superficies neutras
    'bg-gray-50': 'bg-surface',
    'bg-gray-100': 'bg-surface-overlay',
    'bg-gray-200': 'bg-surface-overlay',
    'bg-white': 'bg-surface-raised',
    'bg-slate-50': 'bg-surface',
    'bg-slate-100': 'bg-surface-overlay',
    'bg-slate-200': 'bg-surface-overlay',
    'bg-slate-700': 'bg-surface-overlay',   # so aparece como dark:
    'bg-slate-800': 'bg-surface-raised',    # so aparece como dark:
    # texto neutro
    'text-gray-300': 'text-ink-faint',
    'text-gray-400': 'text-ink-faint',
    'text-gray-500': 'text-ink-muted',
    'text-gray-600': 'text-ink-muted',
    'text-gray-700': 'text-ink',
    'text-gray-800': 'text-ink',
    'text-gray-900': 'text-ink',
    'text-slate-300': 'text-ink-muted',     # dark:
    'text-slate-400': 'text-ink-faint',
    'text-slate-500': 'text-ink-muted',
    'text-slate-600': 'text-ink-muted',
    'text-slate-700': 'text-ink',
    'text-slate-900': 'text-ink',
    # bordas neutras
    'border-gray-200': 'border-ink/10',
    'border-gray-300': 'border-ink/20',
    'border-slate-200': 'border-ink/10',
    'border-slate-300': 'border-ink/20',
    'border-slate-600': 'border-ink/20',    # dark:
    'border-slate-700': 'border-ink/20',    # dark:
    # marca: indigo + blue -> brand
    'bg-indigo-50': 'bg-brand/10',
    'bg-indigo-100': 'bg-brand/15',
    'bg-indigo-600': 'bg-brand',
    'bg-indigo-700': 'bg-brand-600',
    'bg-indigo-900': 'bg-brand/20',         # dark:
    'text-indigo-500': 'text-brand',
    'text-indigo-600': 'text-brand',
    'text-indigo-700': 'text-brand-600',
    'text-indigo-800': 'text-brand-600',
    'border-indigo-200': 'border-brand/30',
    'border-indigo-300': 'border-brand/40',
    'border-indigo-400': 'border-brand/50',
    'border-indigo-500': 'border-brand',
    'border-indigo-600': 'border-brand',
    'ring-indigo-500': 'ring-brand',
    'bg-blue-50': 'bg-brand/10',
    'bg-blue-100': 'bg-brand/15',
    'bg-blue-200': 'bg-brand/20',
    'bg-blue-600': 'bg-brand',
    'bg-blue-700': 'bg-brand-600',
    'text-blue-600': 'text-brand',
    'text-blue-700': 'text-brand-600',
    'border-blue-200': 'border-brand/30',
    'ring-blue-500': 'ring-brand',
    # danger: red
    'bg-red-50': 'bg-danger/10',
    'bg-red-100': 'bg-danger/15',
    'bg-red-500': 'bg-danger',
    'bg-red-600': 'bg-danger',
    'bg-red-700': 'bg-danger/80',
    'bg-red-900': 'bg-danger/20',           # dark:
    'text-red-300': 'text-danger',          # dark:
    'text-red-500': 'text-danger',
    'text-red-600': 'text-danger',
    'text-red-700': 'text-danger',
    'text-red-800': 'text-danger',
    'border-red-200': 'border-danger/40',
    'border-red-300': 'border-danger/50',
    'border-red-800': 'border-danger/40',   # dark:
    'ring-red-400': 'ring-danger',
    # success: green + emerald
    'bg-green-50': 'bg-success/10',
    'bg-green-100': 'bg-success/15',
    'bg-green-500': 'bg-success',
    'bg-green-600': 'bg-success',
    'bg-green-700': 'bg-success/80',
    'text-green-500': 'text-success',
    'text-green-600': 'text-success',
    'text-green-700': 'text-success',
    'text-green-800': 'text-success',
    'border-green-300': 'border-success/40',
    'bg-emerald-100': 'bg-success/15',
    'bg-emerald-500': 'bg-success',
    'bg-emerald-600': 'bg-success',
    'bg-emerald-700': 'bg-success/80',
    'text-emerald-600': 'text-success',
    'text-emerald-700': 'text-success',
    'border-emerald-200': 'border-success/40',
    # amber/yellow (badges de tom/status) -> brand tints
    'bg-amber-100': 'bg-brand/15',
    'bg-amber-500': 'bg-brand',
    'bg-amber-600': 'bg-brand-600',
    'text-amber-600': 'text-brand',
    'text-amber-700': 'text-brand',
    'border-amber-200': 'border-brand/30',
    'bg-yellow-50': 'bg-brand/10',
    'bg-yellow-100': 'bg-brand/15',
    'text-yellow-700': 'text-brand',
    'text-yellow-800': 'text-brand-600',
    'border-yellow-200': 'border-brand/30',
    'border-yellow-300': 'border-brand/40',
    # purple -> section, orange (warning) -> brand tints
    'bg-purple-100': 'bg-section/15',
    'text-purple-600': 'text-section',
    'bg-orange-100': 'bg-brand/10',
    'text-orange-500': 'text-brand',
    'text-orange-700': 'text-brand',
}

# tokens exatos com sufixo de opacidade ou casos especiais (aplicados antes)
EXTRA = {
    'dark:bg-indigo-900/30': 'dark:bg-brand/20',
    'dark:bg-red-900/30': 'dark:bg-danger/15',
    'dark:hover:bg-slate-700/50': 'dark:hover:bg-surface-overlay',
    'dark:text-white': 'dark:text-ink',
}

CORES = sorted(CORE, key=len, reverse=True)
TOKEN = re.compile(
    r'(?<![\w/-])((?:[a-z-]+:)*)('
    + '|'.join(re.escape(c) for c in CORES)
    + r')(?![\w/-])'
)

def migrate(txt: str) -> str:
    for old, new in EXTRA.items():
        txt = txt.replace(old, new)

    def rep(m: re.Match) -> str:
        return m.group(1) + CORE[m.group(2)]
    out = TOKEN.sub(rep, txt)
    # texto escuro sobre fundos claros brand/success/danger (contraste)
    out = re.sub(
        r'\btext-white (?=(?:[\w-]+:)*bg-(?:brand|success|danger)\b)',
        'text-zinc-950 ',
        out,
    )
    out = re.sub(
        r'\bbg-(?:brand|success|danger)(?:/[\d.]+)? text-white\b',
        lambda m: m.group(0).replace('text-white', 'text-zinc-950'),
        out,
    )
    return out

changed = []
for f in FILES:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
        print('MISSING', f)
        continue
    src = open(p).read()
    out = migrate(src)
    if out != src:
        open(p, 'w').write(out)
        changed.append(f)

print(f'{len(changed)} arquivos migrados')
for f in changed:
    print(' -', f)
