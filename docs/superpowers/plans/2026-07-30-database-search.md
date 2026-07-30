# Database-Backed Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken client-side search (empty `[] as Tool[]`) with PostgreSQL `pg_trgm` similarity search via a debounced server action.

**Architecture:** Client debounces input 200ms → calls `searchTools(query)` server action → Drizzle queries published tools ranked by `greatest(similarity(name, q), similarity(hook, q), similarity(description, q)) DESC, trending_score DESC` → client renders existing UI with real results.

**Tech Stack:** Drizzle ORM, PostgreSQL `pg_trgm` extension, React server action, custom `useDebounce` hook.

## Global Constraints

- Follow existing file conventions: kebab-case filenames, `"use server"` for server actions under `src/app/actions/`
- No test framework installed — verify via `npx tsc --noEmit` + `next build` + manual search
- Reuse existing `rowToTool()` from `src/lib/data.ts` (export it)

---

### Task 1: PostgreSQL pg_trgm Migration

**Files:**

- Create: `drizzle/0003_pg_trgm_search.sql`

**Interfaces:**

- Consumes: Nothing
- Produces: `pg_trgm` extension enabled, GIN trgm index on `tools(name, hook, description)`

- [ ] **Step 1: Create migration file**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS tools_search_trgm_idx
  ON tools
  USING gin (name gin_trgm_ops, hook gin_trgm_ops, description gin_trgm_ops);
```

- [ ] **Step 2: Apply migration**

Run: `npx drizzle-kit migrate`
Expected: Migration applied successfully, no errors.

- [ ] **Step 3: Commit**

```bash
git add drizzle/0003_pg_trgm_search.sql
git commit -m "feat: add pg_trgm extension and search index on tools"
```

---

### Task 2: Export rowToTool

**Files:**

- Modify: `src/lib/data.ts:20-37`

**Interfaces:**

- Produces: `export function rowToTool(row)` — maps DB row to `Tool` type (unchanged logic, just exported)

- [ ] **Step 1: Export the function**

In `src/lib/data.ts`, change line 20 from:

```ts
function rowToTool(row: typeof tools.$inferSelect): Tool {
```

to:

```ts
export function rowToTool(row: typeof tools.$inferSelect): Tool {
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts
git commit -m "refactor: export rowToTool for reuse"
```

---

### Task 3: useDebounce Hook

**Files:**

- Create: `src/hooks/use-debounce.ts`

**Interfaces:**

- Produces: `useDebounce<T>(value: T, delayMs: number): T` — returns debounced value

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-debounce.ts
git commit -m "feat: add useDebounce hook"
```

---

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

### Task 5: Connect Search Dialog to Database

**Files:**

- Modify: `src/components/layout/search-dialog.tsx`

**Interfaces:**

- Consumes: `searchTools` from `src/app/actions/search.ts`, `useDebounce` from `src/hooks/use-debounce.ts`
- Produces: Working search against PostgreSQL, loading state, race-condition guard

Change summary:

1. Remove `useMemo` + empty-array search (lines 42-61)
2. Remove unused imports: `CATEGORIES` (line 15), `SIGNAL_META`-related rendering stays
3. Add `useDebounce` import
4. Add `searchTools` import
5. Add `results`, `loading` state (replace useMemo)
6. Add debounce effect that calls `searchTools`
7. Add loading indicator in results area

- [ ] **Step 1: Rewrite search-dialog.tsx**

Full replacement:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  X,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Flame,
  Minus,
  Loader2,
} from "lucide-react";
import type { Tool } from "@/lib/tools-data";
import { CATEGORIES } from "@/lib/tools-data";
import { searchTools } from "@/app/actions/search";
import { useDebounce } from "@/hooks/use-debounce";

const SIGNAL_META: Record<
  Tool["sig"],
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: { label: "Hot", icon: Flame, className: "text-secondary" },
  rising: { label: "Rising", icon: TrendingUp, className: "text-primary" },
  steady: { label: "Steady", icon: Minus, className: "text-muted-foreground" },
};

function catLabel(id: string) {
  return CATEGORIES.find(c => c.id === id)?.label ?? id;
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef(0);

  const debounced = useDebounce(query.trim(), 200);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const version = ++versionRef.current;
    setLoading(true);

    searchTools(debounced).then(tools => {
      if (cancelled || version !== versionRef.current) return;
      setResults(tools);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // reset when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActive(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // clamp active index to results
  useEffect(() => {
    if (results.length === 0) setActive(0);
    else setActive(a => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // keep active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(a => (results.length ? (a + 1) % results.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(a =>
          results.length ? (a - 1 + results.length) % results.length : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[active]) select(results[active]);
      }
    },
    [results, active],
  );

  function select(tool: Tool) {
    onOpenChange(false);
    const el = document.getElementById("trending");
    el?.scrollIntoView({ behavior: "smooth" });
    window.dispatchEvent(
      new CustomEvent("radarly:select-tool", { detail: tool.name }),
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search AI tools"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search tools, categories, sources..."
                className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search query"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {!debounced ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Type to search tools by name, category, or keyword.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tools match{" "}
                    <span className="font-medium text-foreground">{`"${query.trim()}"`}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a category like {'"'}coding{'"'} or {'"'}design{'"'}.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {results.map((t, i) => {
                    const meta = SIGNAL_META[t.sig];
                    const Icon = meta.icon;
                    const isActive = i === active;
                    return (
                      <li key={t.name}>
                        <button
                          type="button"
                          data-index={i}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => select(t)}
                          className={
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " +
                            (isActive ? "bg-muted" : "hover:bg-muted/60")
                          }
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-xs font-semibold text-foreground">
                            {t.score}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {t.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                                <Icon className={"h-3 w-3 " + meta.className} />
                                <span className={meta.className}>
                                  {meta.label}
                                </span>
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {t.hook}
                            </span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-2 sm:flex">
                            <span className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              {catLabel(t.cat)}
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <ArrowUp className="h-3 w-3" />
                  </kbd>
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <ArrowDown className="h-3 w-3" />
                  </kbd>
                  to navigate
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <CornerDownLeft className="h-3 w-3" />
                  </kbd>
                  to select
                </span>
              </span>
              <span className="tabular-nums">
                {results.length} {results.length === 1 ? "result" : "results"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/search-dialog.tsx
git commit -m "feat: connect search dialog to PostgreSQL via server action"
```
