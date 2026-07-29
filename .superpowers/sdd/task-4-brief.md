### Task 4: Refactor tools-data.ts (types only, no mock data)

**Files:**
- Modify: src/lib/tools-data.ts

**Produces:** type exports, CATEGORIES, CATEGORY_LABELS, CATEGORY_PROFILES, toolSlug(), getToolDetail()

- [ ] **Step 1: Remove mock data arrays, keep types and pure functions**

In src/lib/tools-data.ts, delete:
- The `spark()` function (lines 140-148)
- The `TOOLS` array (lines 150-349)
- The `getToolBySlug()` and `getRelatedTools()` functions (lines 358-368)
- The `TOOL_OF_WEEK` object (lines 532-543)
- The `SOURCES` array (lines 545-552)

Keep everything else: type definitions (Tool, Signal, Category, CategoryProfile, ToolDetail), CATEGORIES array, CATEGORY_PROFILES array, CATEGORY_LABELS, toolSlug(), getToolDetail(), getCategoryProfile(), getCategoryTools(), getRelatedCategories(), hash().

Add this re-export at the end of the file:
```ts
export { getAllTools, getToolBySlug, getCategoryTools, getRelatedTools, getCategoryProfiles, getToolOfWeek, getToolDetail } from "./data";
```

- [ ] **Step 2: Verify TypeScript (both tools-data.ts and data.ts)**
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add src/lib/tools-data.ts
git commit -m "refactor: remove mock data, re-export from data layer"
```

---
