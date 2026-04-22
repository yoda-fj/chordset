# Code Review Report: `src/app/eventos/[id]/setlist/page.tsx`

**File:** `src/app/eventos/[id]/setlist/page.tsx`
**Date:** 2026-04-22
**Reviewer:** code-review skill

---

## Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 5 |
| LOW | 2 |

---

## Detailed Findings

### HIGH

**[HIGH] ts:any-usage | Line 14**
```typescript
const [evento, setEvento] = useState<any>(null)
```
Replace `any` with a proper interface. Based on `eventos-db.ts`, use `EventoWithTemplate` or create a local interface.

**Suggested fix:**
```typescript
import type { EventoWithTemplate } from '@/lib/eventos-db'

const [evento, setEvento] = useState<EventoWithTemplate | null>(null)
```

---

**[HIGH] ts:any-usage | Line 15**
```typescript
const [musicas, setMusicas] = useState<any[]>([])
```
Replace `any[]` with a proper interface. The musicas array contains items with `evento_musica` structure joined with `musicas` details.

**Suggested fix:**
```typescript
interface MusicaItem {
  id: number
  musica_id: number
  tom_evento: string | null
  confirmada: boolean
  musicas?: {
    titulo: string
    artista: string
    cifra: string | null
    tom_original: string | null
  }
}

const [musicas, setMusicas] = useState<MusicaItem[]>([])
```

---

### MEDIUM

**[MEDIUM] ts:missing-types | Line 12**
```typescript
const eventoId = parseInt(params.id as string)
```
No validation if `parseInt` returns `NaN` for invalid IDs.

**Suggested fix:**
```typescript
const rawId = parseInt(params.id as string)
if (isNaN(rawId)) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">ID inválido</p>
      <Link href="/eventos" className="text-indigo-600 mt-4 inline-block">Voltar</Link>
    </div>
  )
}
const eventoId = rawId
```

---

**[MEDIUM] react:inline-handler | Line 433**
```typescript
onClick={() => setShowSidebar(false)}
```
Inline arrow functions in render can cause unnecessary re-renders of child components.

**Suggested fix:** Move to useCallback:
```typescript
const closeMobileSidebar = () => setShowSidebar(false)
```

---

**[MEDIUM] perf:unnecessary-re-render | Lines 408-426, 466-482**
Duplicate song list rendering: desktop sidebar (lines 408-426) and mobile sidebar (lines 466-482) render identical components. Consider extracting into a single component or using a shared render function.

**Suggested fix:**
```typescript
const renderSongItem = (item: typeof musicas[0], index: number, onClick: () => void) => (
  <button
    key={item.id}
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-50'}`}
  >
    {/* ... content ... */}
  </button>
)
```

---

**[MEDIUM] react:missing-deps | Line 82**
The useEffect for data loading has `eventoId` in dependency array but also uses `setMusicas`, `setEvento`, etc. These setters are stable but if the effect depends on them being recreated, it could cause issues.

**Current:**
```typescript
}, [eventoId])
```

This is fine since setters from useState are stable, but if additional dependencies are needed, they should be added.

---

**[MEDIUM] ts:non-null-assertion | Lines 352-353**
```typescript
const selectedMusica = musicas[selectedIndex]
const cifra = selectedMusica?.musicas?.cifra || null
```
`musicas[selectedIndex]` could be undefined if index is out of bounds. Consider adding a guard.

---

### LOW

**[LOW] react:inline-handler | Multiple locations**
Multiple inline handlers like `onClick={() => toggleComplete(selectedIndex)}` on lines 394, 451. While not critical, extracting these into named functions improves readability.

---

**[LOW] perf:lazy-loading | Line 7**
```typescript
import { CifraViewer } from '@/components/chords'
```
CifraViewer and its dependencies (ChordViewer, Metronome, Autoscroll) are always loaded. Consider using dynamic import if this page is not frequently accessed:
```typescript
const CifraViewer = dynamic(() => import('@/components/chords/CifraViewer'), { ssr: false })
```

---

## Positive Findings

- Database queries properly use parameterized queries (no SQL injection risk)
- Data fetching happens in useEffect, not during render
- Wake Lock API properly handles errors and visibility changes
- Audio recording properly stops tracks and cleans up blob URLs
- API routes validate input and check entity existence
- Good separation of concerns between mobile/desktop layouts

---

## API Routes Reviewed

- `src/app/api/eventos/[id]/route.ts` - Uses parameterized queries, proper validation
- `src/app/api/eventos/[id]/musicas/route.ts` - Uses parameterized queries, proper error handling
- `src/app/api/eventos/[id]/audio/route.ts` - File type validation, proper cleanup

---

## Summary

The code is well-structured with proper data fetching patterns and security measures. Main improvements needed:
1. Replace `any` types with proper interfaces (HIGH priority)
2. Add validation for parsed ID (MEDIUM priority)
3. Extract duplicate song list rendering to reduce duplication (MEDIUM priority)

No critical security issues or violations of hooks rules detected.