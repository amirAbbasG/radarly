### Task 4: Server Action for Search

**Files:**

- Create: `src/app/actions/search.ts`

**Interfaces:**

- Consumes: `rowToTool` from `src/lib/data.ts`, `db` from `src/lib/db`, `tools` schema from `src/lib/db/schema`
- Produces: `searchTools(query: string): Promise<Tool[]>` — returns ranked published tools matching query, empty array for empty query

- [ ] **Step 1: Create the server action**

```ts
"use server";

import { eq, desc, sql, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { rowToTool } from "@/lib/data";
import type { Tool } from "@/lib/tools-data";

export async function searchTools(query: string): Promise<Tool[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const rows = await db
      .select()
      .from(tools)
      .where(
        or(
          sql`similarity(${tools.name}, ${q}) > 0.1`,
          sql`similarity(${tools.hook}, ${q}) > 0.1`,
          sql`similarity(${tools.description}, ${q}) > 0.1`,
        ),
      )
      .orderBy(
        desc(
          sql`greatest(
            similarity(${tools.name}, ${q}),
            similarity(${tools.hook}, ${q}),
            similarity(${tools.description}, ${q})
          )`,
        ),
      )
      .limit(20);

    return rows.map(rowToTool);
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/search.ts
git commit -m "feat: add server-side pg_trgm search action"
```

---

