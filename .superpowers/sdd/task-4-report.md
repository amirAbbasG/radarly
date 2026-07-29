# Task 4 — Fix Report

## Fix 1: Removed `server-only` leak via re-export

**Problem:** `tools-data.ts` re-exported `getAllTools`, `getToolBySlug`, `getCategoryTools`, `getRelatedTools`, `getCategoryProfiles`, `getToolOfWeek` from `./data`. Since `data.ts` imports `import "server-only"` at the top, any client component importing from `tools-data.ts` would transitively trigger `server-only`, crashing the build.

**Fix:** Removed the 7-line re-export block (lines 305–312). Client components now import types/utils from `tools-data.ts` and async data functions directly from `@/lib/data` (server-only safe). Consumer files (trending-feed, tool-of-week, trust-strip, search-dialog, page.tsx, etc.) are fixed in later tasks.

## Fix 2: Removed `getRelatedCategories`

**Problem:** `getRelatedCategories` existed in `tools-data.ts` but its mock data dependency was deleted during earlier refactoring.

**Fix:** Removed the function (was lines 130–134). It is now provided by `data.ts` or consumers import directly. `getCategoryProfile` kept — it only depends on `CATEGORY_PROFILES` constant which was preserved.

## Verification

```
npx tsc --noEmit — 0 errors in tools-data.ts
```

File length: 312 → 297 lines (-15).
