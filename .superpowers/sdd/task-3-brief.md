### Task 3: Data layer (src/lib/data.ts)

**Files:**
- Create: src/lib/data.ts

**Produces:** getAllTools(), getToolBySlug(), getCategoryTools(), getRelatedTools(), getCategoryProfiles(), getToolOfWeek(), getToolDetail()

**Consumes:** tools table (Task 1), Tool/CategoryProfile types (from tools-data.ts)

- [ ] **Step 1: Create src/lib/data.ts**

```ts
import "server-only";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { sourceLabel } from "@/lib/ingest-utils";
import type { Tool, ToolDetail, CategoryProfile } from "@/lib/tools-data";
import { CATEGORY_PROFILES } from "@/lib/tools-data";

function rowToTool(row: typeof tools.$inferSelect): Tool {
  const history = (row.momentumHistory as { date: string; score: number }[]) ?? [];
  return {
    name: row.name,
    hook: row.hook ?? "",
    cat: row.category ?? "coding",
    score: row.trendingScore ?? 0,
    sig: (row.signal as Tool["sig"]) ?? "steady",
    spark: history.slice(-12).map((e) => e.score),
    source: sourceLabel(row.sourcePlatform),
  };
}

export async function getAllTools(): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

export async function getCategoryTools(category: string): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, category))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getRelatedTools(tool: Tool, limit = 3): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, tool.cat))
    .limit(limit + 1);
  return rows
    .filter((r) => r.name !== tool.name)
    .slice(0, limit)
    .map(rowToTool);
}

export async function getCategoryProfiles(): Promise<CategoryProfile[]> {
  const rows = await db
    .select({
      category: tools.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(tools)
    .where(eq(tools.status, "published"))
    .groupBy(tools.category);

  const countMap = new Map<string, number>();
  for (const r of rows) {
    if (r.category) countMap.set(r.category, r.count);
  }

  return CATEGORY_PROFILES.map((profile) => ({
    ...profile,
    count: countMap.get(profile.toolCategory) ?? 0,
  }));
}

export async function getToolOfWeek(): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

export { getToolDetail } from "@/lib/tools-data";
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/data.ts
git commit -m "feat: add data layer with DB query functions"
```

---
