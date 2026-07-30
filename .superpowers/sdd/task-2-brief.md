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

