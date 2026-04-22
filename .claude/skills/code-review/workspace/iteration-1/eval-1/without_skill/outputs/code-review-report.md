# Code Review: src/app/api/eventos/[id]/route.ts

## Summary

This API route handles CRUD operations for events (GET, PUT, DELETE). While the implementation follows basic patterns, there are several security and robustness issues that should be addressed.

---

## Critical Issues

### 1. Missing Input Validation on ID Parameter (sec:input-validation)

**Location:** Line 12, 49, 65
**Severity:** CRITICAL

```typescript
const evento = eventosDb.getById(parseInt(id))
```

**Problem:** `parseInt(id)` returns `NaN` for invalid strings, which can cause unexpected behavior in database queries (SQLite will match against NaN instead of failing).

**Suggested Fix:**
```typescript
const numericId = parseInt(id)
if (isNaN(numericId)) {
  return NextResponse.json(
    { error: 'ID inválido' },
    { status: 400 }
  )
}
const evento = eventosDb.getById(numericId)
```

---

## High Issues

### 2. PUT Request Body Not Validated (sec:input-validation)

**Location:** Line 35
**Severity:** HIGH

```typescript
const body = await request.json()
```

**Problem:** No schema validation on the incoming JSON. Accepts any structure which could lead to unexpected database errors or security issues.

**Suggested Fix:** Add validation using a library like `zod`:
```typescript
import { z } from 'zod'

const UpdateEventoSchema = z.object({
  nome: z.string().optional(),
  data: z.string().nullable().optional(),
  hora: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  status: z.enum(['rascunho', 'confirmado', 'realizado', 'cancelado']).optional(),
  template_id: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().nullable().optional(),
  isStudyList: z.boolean().optional()
})

const body = UpdateEventoSchema.parse(await request.json())
```

### 3. Missing Authentication Check (sec:auth-check)

**Location:** Lines 9, 32, 62
**Severity:** HIGH

**Problem:** No authentication/authorization verification in the route handlers. Even though middleware.ts handles auth, API routes should explicitly verify the user is authenticated.

**Suggested Fix:**
```typescript
import { getServerSession } from 'next-auth' // or your auth method

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

---

## Medium Issues

### 4. Potential Null Return in PUT (ts:non-null-assertion)

**Location:** Line 51
**Severity:** MEDIUM

```typescript
return NextResponse.json(evento)
```

**Problem:** If `eventosDb.update` throws an error that doesn't get caught, or if the record somehow returns null after update, this could cause issues.

**Suggested Fix:** Add explicit null check:
```typescript
if (!evento) {
  return NextResponse.json(
    { error: 'Evento não encontrado' },
    { status: 404 }
  )
}
return NextResponse.json(evento)
```

### 5. DELETE Doesn't Verify Existence (perf:db-query)

**Location:** Line 65
**Severity:** LOW

**Problem:** DELETE silently succeeds even if the event doesn't exist. For RESTful consistency, should return 404 if the resource doesn't exist.

**Suggested Fix:**
```typescript
const existing = eventosDb.getById(numericId)
if (!existing) {
  return NextResponse.json(
    { error: 'Evento não encontrado' },
    { status: 404 }
  )
}
eventosDb.delete(numericId)
```

---

## Positive Observations

- Parameterized queries are used (via `eventosDb` methods) - no SQL injection risk
- Proper error handling with try/catch blocks
- Consistent HTTP status code usage (404, 500)
- Good separation of concerns by using database abstraction layer

---

## Severity Summary

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 1 | Input validation on ID |
| HIGH | 2 | PUT body validation, missing auth |
| MEDIUM | 2 | Null checks, DELETE existence check |
| LOW | 1 | DELETE silent success |

---

## Recommendations

1. Add input validation at the route level before passing to database layer
2. Add authentication checks to all API routes
3. Consider using a validation library like `zod` for request body validation
4. Add existence checks for DELETE operations