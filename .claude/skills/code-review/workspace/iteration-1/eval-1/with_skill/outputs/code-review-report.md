# Code Review Report: `src/app/api/eventos/[id]/route.ts`

**File:** `src/app/api/eventos/[id]/route.ts`
**Date:** 2026-04-22
**Reviewer:** code-review skill

---

## Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 2 |
| LOW | 0 |

---

## Inline Comments

[HIGH] sec:auth-check | src/app/api/eventos/[id]/route.ts:9,32,62 | Missing auth verification in API route

[HIGH] sec:input-validation | src/app/api/eventos/[id]/route.ts:12,34,64 | Missing validation on API route - parseInt(id) could return NaN

[HIGH] sec:input-validation | src/app/api/eventos/[id]/route.ts:35 | Missing body validation in PUT request

[MEDIUM] ts:non-null-assertion | src/app/api/eventos/[id]/route.ts:51 | Non-null assertion on eventosDb.update result without fallback

[MEDIUM] perf:db-query | src/app/api/eventos/[id]/route.ts:49 | eventosDb.update calls getById after update (double query)

---

## Detailed Findings

### 1. [HIGH] sec:auth-check | Missing auth verification in API route

**Location:** Lines 9, 32, 62 (GET, PUT, DELETE handlers)

**Issue:** This API route handles sensitive operations (read, update, delete events) but has no authentication check.

**Current code:**
```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
  // No auth check
  const { id } = await params
  const evento = eventosDb.getById(parseInt(id))
```

**Suggested fix:**
```typescript
// Add auth check at the start of each handler
// E.g., using middleware or direct check:
const authHeader = request.headers.get('authorization')
if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 2. [HIGH] sec:input-validation | Missing validation - parseInt(id) could return NaN

**Location:** Lines 12, 34, 64

**Issue:** `parseInt(id)` is called without checking if the result is a valid number. If `id` is non-numeric, `parseInt` returns `NaN`, which could cause unexpected behavior or errors.

**Current code:**
```typescript
const { id } = await params
const evento = eventosDb.getById(parseInt(id))
```

**Suggested fix:**
```typescript
const { id } = await params
const parsedId = parseInt(id, 10)
if (isNaN(parsedId)) {
  return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
}
const evento = eventosDb.getById(parsedId)
```

---

### 3. [HIGH] sec:input-validation | Missing body validation in PUT request

**Location:** Line 35

**Issue:** The PUT handler calls `request.json()` without validating the body structure. Invalid or missing required fields could cause runtime errors.

**Current code:**
```typescript
const body = await request.json()

const updateData = {
  nome: body.nome,
  data: body.isStudyList ? null : body.data,
  ...
}
```

**Suggested fix:**
```typescript
const body = await request.json()

// Validate required fields
if (body.nome === undefined) {
  return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
}

// Validate data structure if needed
if (typeof body.nome !== 'string') {
  return NextResponse.json({ error: 'Nome deve ser string' }, { status: 400 })
}
```

---

### 4. [MEDIUM] ts:non-null-assertion | Non-null assertion without fallback

**Location:** Line 51

**Issue:** The return statement assumes `eventosDb.update()` always returns an evento, but based on the implementation in `eventos-db.ts:201-203`, it throws an error if the evento is not found, not returns null. However, this behavior should be explicitly handled.

**Current code:**
```typescript
const evento = eventosDb.update(parseInt(id), updateData)
return NextResponse.json(evento)
```

**Suggested fix:** The code is actually safe since `update()` throws if not found, but consider adding explicit error handling:
```typescript
// Already handled - the update() throws if evento not found
const evento = eventosDb.update(parsedId, updateData)
return NextResponse.json(evento)
```

---

### 5. [MEDIUM] perf:db-query | Double query in update operation

**Location:** Line 49

**Issue:** `eventosDb.update()` internally calls `getById()` after updating (see `eventos-db.ts:201`). This means the update operation queries the database twice: once for the UPDATE and once for the SELECT.

**Current code:**
```typescript
const evento = eventosDb.update(parseInt(id), updateData)
```

**Note:** This is a design decision in `eventos-db.ts`. The update returns the full updated object by fetching it again. If performance is critical, the update method could be modified to return the row directly without a second query.

---

## Positive Observations

1. **SQL Injection Prevention:** Uses parameterized queries via `eventosDb` methods (lines 12, 49, 65). No string concatenation in SQL.

2. **Error Handling:** All handlers have try-catch blocks with proper error responses and logging.

3. **Status Codes:** Appropriate HTTP status codes used (404, 500 for GET/DELETE/PUT).

4. **Async/Await:** Properly uses async/await pattern for params Promise handling (compatible with Next.js 16).

---

## Summary

This API route is generally well-structured with proper error handling and SQL injection prevention. The main issues are:

1. **Authentication is missing** - critical for production
2. **Input validation is lacking** - `id` and `body` should be validated before use
3. **Minor performance consideration** - double query on update (but acceptable)

**Recommendation:** Address the HIGH severity items before merging to production, especially adding authentication checks.