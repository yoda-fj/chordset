# Code Review Skill Evaluation Cases

## Test Case 1: SQL Injection Vulnerability

**File**: `src/lib/db.ts`
**Expected Finding**: CRITICAL - sec:sql-injection

```typescript
// VULNERABLE CODE - should be flagged
export function getMusicaById(id: number) {
  const query = db.prepare(`SELECT * FROM musicas WHERE id = ${id}`);
  return query.get();
}

// SECURE CODE - not flagged
export function getMusicaByIdSecure(id: number) {
  const stmt = db.prepare('SELECT * FROM musicas WHERE id = ?');
  return stmt.get(id);
}
```

## Test Case 2: DB Query During Render

**File**: `src/app/eventos/[id]/page.tsx`
**Expected Finding**: HIGH - perf:db-query

```typescript
// PROBLEMATIC CODE - should be flagged
export default function EventoPage({ params }: { params: { id: string } }) {
  const event = getEventoById(params.id); // DB query during render
  return <div>{event.nome}</div>;
}

// CORRECT CODE - not flagged
export default function EventoPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    getEventoById(params.id).then(setEvent);
  }, [params.id]);

  if (!event) return <Loading />;
  return <div>{event.nome}</div>;
}
```

## Test Case 3: Missing Auth Check

**File**: `src/app/api/eventos/[id]/route.ts`
**Expected Finding**: HIGH - sec:auth-check

```typescript
// PROBLEMATIC CODE - should be flagged
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // No auth check - anyone can delete
  db.prepare('DELETE FROM eventos WHERE id = ?').run(params.id);
  return Response.json({ success: true });
}

// CORRECT CODE - not flagged
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !verifyAuth(authHeader)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  db.prepare('DELETE FROM eventos WHERE id = ?').run(params.id);
  return Response.json({ success: true });
}
```

## Test Case 4: dangerouslySetInnerHTML

**File**: `src/components/chords/ChordDisplay.tsx`
**Expected Finding**: HIGH - sec:xss

```typescript
// VULNERABLE CODE - should be flagged
function ChordDisplay({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// SAFER CODE - with sanitization, not flagged
import DOMPurify from 'dompurify';

function ChordDisplay({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
}
```

## Test Case 5: Inline Handler Causing Re-renders

**File**: `src/app/eventos/[id]/setlist/page.tsx`
**Expected Finding**: MEDIUM - react:inline-handler

```typescript
// PROBLEMATIC CODE - should be flagged
return (
  <ul>
    {items.map(item => (
      <li key={item.id}>
        <button onClick={() => handleClick(item.id)}>{item.name}</button>
      </li>
    ))}
  </ul>
);

// CORRECT CODE - not flagged
const handleItemClick = useCallback((id: string) => {
  handleClick(id);
}, [handleClick]);

return (
  <ul>
    {items.map(item => (
      <li key={item.id}>
        <button onClick={() => handleItemClick(item.id)}>{item.name}</button>
      </li>
    ))}
  </ul>
);
```

## Test Case 6: Missing Dependencies in useEffect

**File**: `src/app/musicas/[id]/page.tsx`
**Expected Finding**: HIGH - react:missing-deps

```typescript
// PROBLEMATIC CODE - should be flagged
useEffect(() => {
  fetchMusica(id).then(setMusica);
}, []); // Missing 'id' dependency

// CORRECT CODE - not flagged
useEffect(() => {
  fetchMusica(id).then(setMusica);
}, [id]);
```

## Test Case 7: Large Bundle - Client Import

**File**: `src/app/musicas/[id]/cifra/page.tsx`
**Expected Finding**: HIGH - perf:large-bundle

```typescript
// PROBLEMATIC CODE - should be flagged
'use client';
import { Database } from 'better-sqlite3'; // Heavy native module in client

// CORRECT CODE - not flagged
// better-sqlite3 should only be imported in server-side code
// For client features, use API routes instead
```

## Test Case 8: TypeScript any Usage

**File**: `src/lib/utils.ts`
**Expected Finding**: MEDIUM - ts:any-usage

```typescript
// PROBLEMATIC CODE - should be flagged
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// CORRECT CODE - not flagged
interface DataItem {
  value: string;
}
function processData(data: DataItem[]) {
  return data.map((item) => item.value);
}
```

## Test Case 9: Proper Client/Server Boundary

**File**: `src/app/eventos/page.tsx`
**Expected Finding**: MEDIUM - next:client-server-boundary

```typescript
// PROBLEMATIC CODE - should be flagged
'use client';
import { db } from '@/lib/db'; // Server-only module in client
import { useState } from 'react';

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  // ...
}

// CORRECT CODE - not flagged
// Use API routes to fetch data from SQLite
// 'use client' for interactive components that fetch via API
```

## Test Case 10: Input Validation

**File**: `src/app/api/musicas/route.ts`
**Expected Finding**: HIGH - sec:input-validation

```typescript
// PROBLEMATIC CODE - should be flagged
export async function POST(request: Request) {
  const body = await request.json();
  // No validation of required fields
  db.prepare('INSERT INTO musicas (titulo, artista) VALUES (?, ?)')
    .run(body.titulo, body.artista);
  return Response.json({ success: true });
}

// CORRECT CODE - not flagged
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.titulo || typeof body.titulo !== 'string') {
    return Response.json({ error: 'Invalid titulo' }, { status: 400 });
  }
  db.prepare('INSERT INTO musicas (titulo, artista) VALUES (?, ?)')
    .run(body.titulo, body.artista);
  return Response.json({ success: true });
}
```
