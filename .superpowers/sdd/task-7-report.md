# Task 7 Report — GitHub Ingest Route

**Status:** Done

**File created:** `src/app/api/ingest/github/route.ts`

**Steps completed:**

1. Created directory `src/app/api/ingest/github/`
2. Wrote route.ts with verbatim code from brief
3. Verified with `npx tsc --noEmit` — no new errors. The `Response.json` TS error on line 62 is pre-existing across all ingest routes (devto, hackernews, producthunt also affected). Not a regression from this task.
4. Committed: `bda9ab1 feat: add GitHub ingest route`

**Details:**

- Route: `GET /api/ingest/github`
- Auth: uses `verifyIngestAuth` (shared ingest utility)
- Fetches top 15 GitHub repos tagged `topic:ai`, sorted by stars
- Upserts into `tools` table via Drizzle (`onConflictDoUpdate` on `sourcePlatform + externalId`)
- Trending score: `Min(100, round(log2(stars + 1) * 10))`
- Max duration: 25s
- Optional `GITHUB_TOKEN` env variable for higher rate limit
