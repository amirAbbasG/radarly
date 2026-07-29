### Task 3 Report: Data layer (src/lib/data.ts)

**Status:** Done

**Created:** `src/lib/data.ts` (96 lines)

**Exports:**

- `getAllTools()` — all published tools ordered by trendingScore
- `getToolBySlug(slug)` — single tool by slug, or null
- `getCategoryTools(category)` — tools filtered by category
- `getRelatedTools(tool, limit=3)` — same-category tools excluding self
- `getCategoryProfiles()` — CATEGORY_PROFILES enriched with live DB counts
- `getToolOfWeek()` — top trending published tool
- `getToolDetail` — re-exported from `@/lib/tools-data` (mock, cleaned in Task 4)

**TypeScript:** `npx tsc --noEmit` — 0 new errors. Only pre-existing errors in `animated-theme-toggler.tsx` (unrelated `startViewTransition`).

**Commit:** `53070ad` — `feat: add data layer with DB query functions`
