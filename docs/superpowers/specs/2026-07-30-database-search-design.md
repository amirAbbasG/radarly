# Database-Backed Search

## Problem

Search dialog operates on hardcoded empty array (`[] as Tool[]`). No server-side search exists. Dialog was never connected to real data after DB pipeline migration.

## Architecture

```
SearchDialog (client)
  ├── 200ms debounce on input
  ├── calls searchTools(query) server action ──► Drizzle + pg_trgm ──► PostgreSQL
  └── renders ranked Tool[] (reuses existing UI: signal icons, category badges, keyboard nav)
```

No props change. Caller (`Navbar`) stays untouched.

## Data Flow

1. User types → debounce 200ms
2. Debounce fires → `searchTools(query)` server action
3. Server: `greatest(similarity(name, $q), similarity(hook, $q), similarity(description, $q))` against published tools, ordered by `sim_score DESC, trending_score DESC`, LIMIT 20
4. Results mapped through existing `rowToTool()` → returned as `Tool[]`
5. Client sets `results`, reuses existing render + keyboard nav

Empty query → no server call. Empty results → existing "No tools match" UI.

## Files Changed

| File                                      | Change                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/schema.ts`                    | No schema change — index managed via raw SQL migration                                                          |
| `drizzle/` (migration)                    | New migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm` + GIN trgm index on `tools(name, hook, description)`    |
| `src/app/actions/search.ts`               | New: `searchTools(query: string): Promise<Tool[]>` server action                                                |
| `src/components/layout/search-dialog.tsx` | Remove `(general)` import (line 45), add `searchTools` import + debounce + loading state + race-condition guard |

### Search Action (`src/app/actions/search.ts`)

```ts
"use server";

import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { rowToTool } from "@/lib/data"; // or inline
import type { Tool } from "@/lib/tools-data";

export async function searchTools(query: string): Promise<Tool[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
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
}
```

Note: `rowToTool` is currently a private function in `data.ts`. Either export it or inline.

### Search Dialog Changes

- Replace `([] as Tool[])` with state from server action
- Add `useDebounce(query, 200)` custom hook
- Add `useEffect` to call `searchTools` on debounced value change
- Track `loading` state: show subtle indicator while fetching
- Guard against race conditions: use a counter/ref to discard stale responses

## Indexing Strategy

`pg_trgm` GIN index on `(name, hook, description)`. Covers all searchable text fields:

- `name`: exact/prefixed by user (primary intent)
- `hook`: short description line (secondary intent)
- `description`: full text (deep match)

`similarity()` handles typo tolerance, partial matches, and substring matching in one function. No separate ILIKE needed.

## Error & Edge Cases

- **Empty query**: Return `[]` immediately, no DB call
- **No results**: Existing "No tools match" UI
- **DB error**: Catch, return `[]`, log server-side
- **Loading**: Subtle skeleton/spinner on results area during fetch
- **Race condition**: If user types faster than responses return, discard stale responses by comparing query version
- **Rate limiting**: Not needed — server action context + small result set

## Testing

- Server action: `searchTools("copilot")` returns relevant tools, `searchTools("")` returns `[]`
- Component: existing keyboard nav + render logic unchanged (already written and working aside from data source)
- Integration: open search, type, verify DB results appear

## What's Skipped

- No API route (single consumer, server action sufficient)
- No instant client-side pre-filter (user explicitly wants DB source)
- No `tsvector`/`tsquery` full-text search (pg_trgm handles the use case: tool names + short hooks, not documents)
- No caching layer (search results change with trending scores; low traffic, DB query fast enough)
