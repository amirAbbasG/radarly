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

