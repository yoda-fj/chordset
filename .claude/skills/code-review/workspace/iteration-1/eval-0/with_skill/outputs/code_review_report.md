# Code Review Report: src/lib/db.ts

**Review Date:** 2026-04-22
**File:** src/lib/db.ts
**Reviewer:** code-review skill

---

## Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 2 |

---

## Detailed Findings

### Performance

**[MEDIUM] perf:db-init** | src/lib/db.ts:10-16
**Issue:** Database initialization occurs on first call to getDb(), but this lazy initialization pattern is fine for single-instance patterns. However, the initSchema() function runs on every cold start and reads schema.sql from disk synchronously.

**Recommendation:** Consider using `fs.readFileSync` only during initial setup. If schema.sql is large, consider caching or async loading.

---

### TypeScript

**[MEDIUM] ts:any-usage** | src/lib/db.ts:26, 41
**Issue:** Using `as any[]` for pragma query results lacks type safety.

```typescript
const musicasColumns = db.prepare("PRAGMA table_info(musicas)").all() as any[]
```

**Recommendation:** Define proper interfaces for PRAGMA results:

```typescript
interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const musicasColumns = db.prepare("PRAGMA table_info(musicas)").all() as TableColumn[]
```

**[MEDIUM] ts:any-usage** | src/lib/db.ts:26, 41
**Issue:** Empty catch blocks swallow errors silently.

```typescript
} catch (e) {
  // ignore
}
```

**Recommendation:** At minimum, log the error or use a specific error type:

```typescript
} catch (e) {
  console.warn('[Migration] Column may already exist:', e);
}
```

---

### Error Handling

**[LOW] error-handling** | src/lib/db.ts:53-55
**Issue:** Catch block only logs to console. For a database initialization failure, this might be acceptable, but consider whether the application should gracefully degrade or fail fast.

```typescript
} catch (error) {
  console.error('Erro ao inicializar schema:', error)
}
```

**Recommendation:** This is acceptable for now. Consider adding application-level error handling for schema init failures.

---

### Security

**[LOW] sec:path-traversal** | src/lib/db.ts:5
**Observation:** `process.env.DATABASE_PATH` is used directly without validation. While this is a common pattern, ensure that if DATABASE_PATH is user-controlled, proper path validation exists.

**Note:** This is LOW because the default path is safe (cwd-based), and env vars are typically server-controlled.

---

## Positive Observations

1. **Good pattern:** Using WAL mode (`db.pragma('journal_mode = WAL')`) - this is the recommended SQLite mode for Next.js applications as it allows concurrent reads while writing.

2. **Good pattern:** Lazy initialization of database connection prevents issues during build time when database might not be available.

3. **Good pattern:** Migration logic checks for column existence before adding, preventing errors on re-initialization.

4. **Good pattern:** Using `better-sqlite3` which is synchronous but well-suited for server-side usage in Next.js API routes.

---

## Suggested Fixes (Priority Order)

### 1. Add TypeScript interfaces for PRAGMA results

```typescript
interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}
```

This improves type safety and catches errors at compile time rather than runtime.

### 2. Improve catch block logging

Instead of silent catches, log warnings:

```typescript
} catch (e) {
  console.warn('[Migration] Skipping column check:', e);
}
```

---

## Conclusion

The `src/lib/db.ts` file is well-structured and follows good practices for SQLite integration in a Next.js application. No critical or high-severity issues found. The main improvements are around TypeScript type safety and more informative error handling.

**Overall Rating:** Good

**Recommended Actions:**
- Add TypeScript interfaces for table columns (MEDIUM priority)
- Improve catch block logging to be less silent (MEDIUM priority)