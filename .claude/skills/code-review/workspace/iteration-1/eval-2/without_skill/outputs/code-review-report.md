# Code Review Report: src/app/eventos/[id]/setlist/page.tsx

## File Summary
- **Lines**: 640
- **Type**: Client Component ('use client')
- **Purpose**: Setlist page for events, displaying songs with chords and audio recording functionality

---

## Findings

### HIGH Severity

**[HIGH] perf:db-query | line 54-55 | API fetch during data loading**
```typescript
const [eventoRes, musicasRes] = await Promise.all([
  fetch(`/api/eventos/${eventoId}`),
  fetch(`/api/eventos/${eventoId}/musicas`)
])
```
Data loading is correctly wrapped in `useEffect`, so this is acceptable. No issue here.

---

**[HIGH] react:missing-deps | line 82 | Missing dependency in useEffect**
```typescript
useEffect(() => {
  async function loadData() {
    // ...
  }
  loadData()
}, [eventoId])
```
The `loadData` function is defined inside the effect but not included in the dependency array. If `loadData` changes (unlikely but possible), the effect won't re-run. While this works, extracting `loadData` outside or including it in deps is safer.

---

**[HIGH] react:inline-handler | lines 360, 370, 394, 412, 469, etc. | Inline arrow functions in render**

Multiple inline arrow functions in JSX that create new function references on every render:
- Line 360: `onClick={() => router.back()}`
- Line 370: `onClick={() => setShowSidebar(!showSidebar)}`
- Line 394: `onClick={() => toggleComplete(selectedIndex)}`
- Line 412: `onClick={() => selectMusica(index)}`
- Line 469: `onClick={() => { selectMusica(index); setShowSidebar(false) }}`

These cause potential unnecessary re-renders of child components. Consider using `useCallback` for handler functions.

---

**[HIGH] ts:any-usage | lines 14-15, 17, 20 | Using `any` type without justification**

```typescript
const [evento, setEvento] = useState<any>(null)
const [musicas, setMusicas] = useState<any[]>([])
const [currentTom, setCurrentTom] = useState<string | null>(null)
const [error, setError] = useState<string | null>(null)
```
These should use proper TypeScript interfaces. Consider creating types for `Evento` and `Musica`.

---

### MEDIUM Severity

**[MEDIUM] react:hooks-rules | line 42-47 | useEffect with conditional audio sync**

```typescript
useEffect(() => {
  if (audioRef.current && audioUrl) {
    audioRef.current.src = audioUrl
    setIsPlaying(false)
  }
}, [audioUrl])
```
This effect runs on every `audioUrl` change but the condition `audioRef.current && audioUrl` makes it conditional. This is generally fine but could be clearer. However, `audioRef.current` is a ref and won't cause re-renders when changed.

---

**[MEDIUM] perf:unnecessary-re-render | lines 408-426 | Song list re-renders on every state change**

The entire song list in the sidebar re-renders whenever any state changes (selectedIndex, musicas, etc.). The `key={item.id}` is correctly used. Consider wrapping the list item rendering in `React.memo` or using `useMemo` for the list.

---

**[MEDIUM] ts:non-null-assertion | lines 12, 353 | Non-null assertions without fallback**

```typescript
const eventoId = parseInt(params.id as string)
```
Line 12 uses `as string` assertion. If `params.id` is undefined, `parseInt(undefined)` returns `NaN`, which could cause issues. Consider adding validation:
```typescript
const id = parseInt(params.id as string)
if (isNaN(id)) { /* handle error */ }
```

---

**[MEDIUM] next:client-server-boundary | line 1 | Component marked 'use client' but could be partial**

The entire component is a client component due to hooks usage. However, the initial data fetching could potentially be done server-side with `async` page component and passed as props, reducing client bundle size. Consider splitting: server component for data fetching, client component for interactivity.

---

### LOW Severity

**[LOW] perf:lazy-loading | Component could use dynamic imports**

The component imports many icons from 'lucide-react'. Consider using `next/dynamic` to lazily load the component if it's not always needed, or use `React.lazy` for code splitting.

---

**[LOW] Code Duplication | lines 379-429 and 437-484 | Sidebar code duplicated for desktop/mobile**

The sidebar JSX is largely duplicated between the desktop sidebar (lines 379-429) and mobile sidebar (lines 437-484). Extract into a separate component like `SongSidebar` to reduce duplication.

---

## Summary

| Category | Count |
|----------|-------|
| Critical | 0 |
| High | 5 |
| Medium | 5 |
| Low | 2 |
| **Total** | **12** |

## Suggested Fixes (Priority Order)

1. **Replace `any` types with proper interfaces** - Create `Evento` and `Musica` interfaces for type safety
2. **Extract inline handlers** - Use `useCallback` for `goNext`, `goPrev`, `selectMusica`, `toggleComplete`
3. **Add input validation** - Validate `eventoId` before using it in API calls
4. **Extract sidebar component** - Reduce code duplication between desktop and mobile sidebars
5. **Consider partial hydration** - Split into server (data fetching) and client (interactivity) components

---

*Review generated by code-review skill*