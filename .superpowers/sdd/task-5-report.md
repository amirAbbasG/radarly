### Task 5: Dev.to ingest route — DONE

**Status:** Complete

**Files:**

- Created: `src/app/api/ingest/devto/route.ts`

**Verification:**

- `npx tsc --noEmit`: no new errors (pre-existing `Response.json` types and unrelated missing exports remain)
- Commit: `3f8b3f4` — `feat: add Dev.to ingest route`

**Notes:**

- Route fetches top 15 Dev.to articles tagged "ai" from past 7 days
- Auth via `verifyIngestAuth` (Task 2)
- Upserts into `tools` table with `onConflictDoUpdate` on `(sourcePlatform, externalId)`
- Slug generated from title, capped at 200 chars
- Trending score: `min(100, reactions * 0.8)`
- `maxDuration = 25` seconds
