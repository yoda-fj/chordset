---
name: code-review
description: Code review skill for chordset project focusing on Next.js + TypeScript + Supabase/SQLite best practices.
allowed-tools: Bash(npx:*) Glob(Glob:*) Grep(Grep:*) Read(Read:*) Task(Task:Explore)
---

# Code Review Skill for Chordset

## Overview

This skill performs code reviews on the chordset project with focus on:
- **Performance** - Next.js optimization, database queries, bundle size
- **Security** - Input validation, auth checks, SQL injection prevention
- **Best Practices** - React patterns, TypeScript usage, Next.js conventions
- **Architecture** - Component structure, data fetching patterns, error handling

## Usage

```
/code-review
/code-review [file(s)]
```

When invoked without files, reviews all code in the project.
When invoked with specific files, reviews only those files.

## Review Categories

### 1. Performance

| Check | Severity | Description |
|-------|----------|-------------|
| `perf:db-query` | High | Database queries in render paths (use useEffect, not during render) |
| `perf:large-bundle` | High | Large dependencies (cheerio, better-sqlite3) in client bundle |
| `perf:image-optimization` | Medium | Missing next/image for optimized images |
| `perf:lazy-loading` | Medium | Components not using dynamic imports |
| `perf:unnecessary-re-render` | Medium | Missing useMemo/useCallback for expensive computations |

### 2. Security

| Check | Severity | Description |
|-------|----------|-------------|
| `sec:sql-injection` | Critical | String concatenation in SQL queries |
| `sec:xss` | Critical | Dangerous dangerouslySetInnerHTML usage |
| `sec:input-validation` | High | Missing validation on API routes |
| `sec:auth-check` | High | Missing auth verification in API routes |
| `sec:sensitive-data` | High | Exposure of credentials or secrets |

### 3. React/Next.js Best Practices

| Check | Severity | Description |
|-------|----------|-------------|
| `react:hooks-rules` | High | Violation of hooks rules (call hooks unconditionally) |
| `react:missing-deps` | High | Missing dependencies in useEffect/useCallback |
| `react:inline-handler` | Medium | Inline arrow functions in render causing re-renders |
| `next:server-actions` | Medium | Using REST for operations that should be Server Actions |
| `next:client-server-boundary` | Medium | Improper use of 'use client' directive |

### 4. TypeScript

| Check | Severity | Description |
|-------|----------|-------------|
| `ts:any-usage` | Medium | Use of `any` type without justification |
| `ts:missing-types` | Medium | Implicit any or missing return types |
| `ts:non-null-assertion` | Medium | Non-null assertions without fallback |

## Output Format

Reviews are output as inline comments with severity indicators:

```
[CRITICAL] sec:sql-injection | src/lib/db.ts:45 | String concatenation in query
[HIGH] perf:db-query | src/app/eventos/[id]/page.tsx:23 | DB query during render
```

Followed by a markdown summary report with suggested fixes.

## Project Context

### Tech Stack
- **Framework**: Next.js 16.2.3 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite (better-sqlite3) with WAL mode
- **Auth**: Basic Auth via middleware.ts
- **Optional**: Supabase for cloud sync
- **UI**: React 19, Tailwind CSS 3.3, Lucide React

### Key Files to Review
- `src/app/**/*.tsx` - Next.js pages and API routes
- `src/lib/**/*.ts` - Database queries, Supabase client
- `src/components/**/*.tsx` - React components
- `src/hooks/**/*.ts` - Custom React hooks
- `middleware.ts` - Auth middleware

### Database Patterns
```typescript
// Correct: Use parameterized queries
const stmt = db.prepare('SELECT * FROM musicas WHERE id = ?');
const result = stmt.get(id);

// Incorrect: String concatenation
const result = db.exec(`SELECT * FROM musicas WHERE id = ${id}`);
```

### Client/Server Boundary
- Pages are Server Components by default
- Add `'use client'` only when using browser APIs or React hooks
- API routes handle form actions and server-side logic
- Keep sensitive operations on the server

## Severity Levels

- **CRITICAL**: Must fix immediately (security vulnerabilities, data loss risk)
- **HIGH**: Should fix before merge (performance issues, bugs)
- **MEDIUM**: Should fix when convenient (code smells, minor issues)
- **LOW**: Nice to have (improvements, suggestions)

## Process

1. Identify files to review (or all if unspecified)
2. Run checks for each category
3. Collect findings with file path, line number, severity, and description
4. Output inline comments for each finding
5. Generate markdown summary with findings grouped by severity
6. Provide suggested fixes for critical and high severity issues
