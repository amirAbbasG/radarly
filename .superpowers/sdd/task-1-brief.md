### Task 1: Database schema (tools table)

**Files:**
- Modify: src/lib/db/schema.ts

**Produces:** tools table, statusEnum

- [ ] **Step 1: Add tools table and statusEnum to schema.ts**

In src/lib/db/schema.ts, change the import at line 1 from:
```ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
```
to:
```ts
import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, unique } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending_summary", "published", "archived"]);

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    hook: text("hook"),
    description: text("description"),
    category: text("category"),
    tags: jsonb("tags").$type<string[]>(),
    sourcePlatform: text("source_platform").notNull(),
    externalId: text("external_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    website: text("website"),
    trendingScore: integer("trending_score").default(0),
    momentumHistory: jsonb("momentum_history")
      .$type<{ date: string; score: number }[]>()
      .default([]),
    signal: text("signal"),
    status: statusEnum("status").default("pending_summary"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  },
  (table) => ({
    sourceUnique: unique().on(table.sourcePlatform, table.externalId),
  }),
);
```

Keep the existing user, session, account, verification, toolSubmissions tables below, unchanged.

- [ ] **Step 2: Generate and run migration**
```bash
npx drizzle-kit generate; if ($?) { npx drizzle-kit migrate }
```
Expected: migration file created in drizzle/, "Migration complete".

- [ ] **Step 3: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add tools table and status enum to schema"
```

---
