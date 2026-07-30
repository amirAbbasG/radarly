# Task 2 Report: Export rowToTool

## Status: Done

## What was done

Added `export` keyword to `rowToTool()` at `src/lib/data.ts:20`. No logic changes.

```ts
// Before
function rowToTool(row: typeof tools.$inferSelect): Tool {

// After
export function rowToTool(row: typeof tools.$inferSelect): Tool {
```

## Verification

- `npx tsc --noEmit`: 8 pre-existing errors (ingest route `Response.json`, `startViewTransition`). Zero new errors from this change.
- Commit: `af5f0d5` — `refactor: export rowToTool for reuse`

## Concerns

None.
