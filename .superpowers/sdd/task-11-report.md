### Task 11 Report — Home page wired to DB data

**Status:** Complete. TypeScript passes with 0 new errors.

---

**Files modified (7):**

1. `src/app/page.tsx` — Made async, fetches `getAllTools()`, `getToolOfWeek()`, `getCategoryProfiles()` from `@/lib/data`, passes results as props to child components.

2. `src/features/home/hero.tsx` — Accepts `toolCount` prop (default 0), replaces hardcoded `1680` with the prop.

3. `src/features/home/trending-feed.tsx` — Accepts `tools: Tool[]` and `categories: Category[]` props. Removed `TOOLS`/`CATEGORIES` imports, added type-only imports. All internal references now use props.

4. `src/features/home/tool-of-week.tsx` — Accepts `tool: Tool | null` prop, returns null if falsy. Stats derived from Tool type fields (score, sig, source). Removed `TOOL_OF_WEEK` import.

5. `src/features/home/categories.tsx` — Accepts `categoryProfiles: CategoryProfile[]` prop. Replaced hardcoded `CATS` constant with `ICON_MAP`/`COLOR_MAP` lookup tables. Maps profiles to display objects inside component.

6. `src/features/home/trust-strip.tsx` — Removed `SOURCES` import (ghost export). Inlined 6 source labels as local constant.

7. `src/components/layout/search-dialog.tsx` — Removed `TOOLS` import (ghost export). Search now uses empty array `[] as Tool[]`. Search dialog renders but shows no results until wired to props — secondary UI, non-blocking.

---

**TypeScript result:**

```
npx tsc --noEmit → 16 errors in 8 files (all preexisting)
  - src/app/api/ingest/* (7 errors) — Response.json type issue
  - src/app/categories/[slug]/page.tsx (2) — stale imports to be fixed later
  - src/app/tools/[slug]/page.tsx (5) — stale imports to be fixed later
  - src/components/ui/animated-theme-toggler.tsx (2) — startViewTransition
```

Zero new errors introduced by any of the 7 modified files.

---

**Skipped:** Wired search-dialog to props (needs Navbar refactor, secondary UI). Add when search feature is prioritized.
