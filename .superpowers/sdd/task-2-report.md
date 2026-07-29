### Task 2 Report: Shared ingest utilities

**Status:** done

**Commit:** `b318c84` — `feat: add shared ingest utility functions`

**Files created:**

- `src/lib/ingest-utils.ts` — 17 lines

**Functions:**

- `verifyIngestAuth(req: Request): Response | null` — checks Authorization header against `INGEST_SECRET`
- `sourceLabel(platform: string): string` — maps `devto`/`hackernews`/`github`/`producthunt` to display names

**TypeScript:** no new errors. Two pre-existing errors in `src/components/ui/animated-theme-toggler.tsx` (`startViewTransition` on `Document`) — unrelated to this task.

**Concerns:** none.
