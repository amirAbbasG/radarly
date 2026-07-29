### Task 12: Update tool detail page — COMPLETE

**File:** `src/app/tools/[slug]/page.tsx`

**Changes:**

- Removed `generateStaticParams()`
- Replaced sync `getToolBySlug()` / `getRelatedTools()` from `@/lib/tools-data` with async DB queries from `@/lib/data`
- `getToolDetail()` stays sync from `@/lib/tools-data`
- Rank computed from `getAllTools()` instead of `TOOLS.findIndex()`
- Page now async

**Verification:** `npx tsc --noEmit` — 0 new errors. 11 pre-existing errors in 7 other files (unrelated).

**Commit:** `aefb550` — `feat: wire tool detail page to DB queries`
