# Radarly — Data ingestion pipeline plan

## Is this possible with Next.js only?

Partly. Next.js API routes (App Router route handlers) can do all the actual work — fetching from each source, normalizing data, calling an LLM to summarize, writing to Postgres via Drizzle. That part is 100% Next.js.

What Next.js **can't** do on its own is wake itself up on a schedule. Something external has to call your route every N hours. Two realistic options for your stack:

| Option | Cadence | Cost | Notes |
|---|---|---|---|
| **Vercel Cron** | Hobby: once/day only, imprecise (fires sometime within the hour). Pro: per-minute. | Free (Hobby) / $20/mo (Pro) | Simplest setup — just a `vercel.json` entry. Hobby's once-a-day cap is the real limitation for a "trending now" product. |
| **GitHub Actions cron** (recommended) | Any interval you want, reliably | Free | External to Vercel, calls your deployed API route over HTTPS with a secret header. Bypasses the Hobby daily cap entirely. |

**My recommendation: GitHub Actions.** You're almost certainly already using GitHub for this repo, it costs nothing, and it gives you hourly (or whatever cadence you want) updates without paying for Vercel Pro just to unlock cron frequency.

---

## Per-source feasibility (checked current status)

| Source | Method | Auth | Cost | Notes |
|---|---|---|---|---|
| **Dev.to** | REST API (`/api/articles?tag=ai`) | None needed | Free | Easiest source — start here. |
| **Hacker News** | Algolia HN Search API (`hn.algolia.com`) | None needed | Free | Better than the raw Firebase API for filtering by keyword/points — use this for "Show HN" AI tool posts. |
| **GitHub** | Search API (no official "trending" endpoint exists — this is a longstanding gap, not new) | Personal access token | Free (5,000 req/hr authenticated) | Query `search/repositories` sorted by stars, filtered by `created:>date` as a trending proxy. |
| **Product Hunt** | GraphQL API | OAuth developer token | Free for reasonable polling volume | Straightforward once you register a developer app. |
| **Reddit** | Official Data API | OAuth app, **requires manual pre-approval as of Nov 2025** | Free tier: 100 queries/min, **non-commercial use only** | Apply for access now if you want it — 2-4 week review. Also worth flagging: if this site ever runs ads, that likely counts as commercial use, which the free tier explicitly excludes. |
| **X / Twitter** | Search API | OAuth app | Pay-per-use since Feb 2026 (~$0.005/read) | Real ongoing cost, no free tier anymore. Given the cost and complexity, consider the manual-curation + free embed approach discussed earlier instead of automated polling, at least for MVP. |

**Suggested build order:** Dev.to → Hacker News → GitHub → Product Hunt first (all free, no approval wait). Treat Reddit and X/Twitter as Phase 2 — Reddit because of the approval lag, X because of ongoing cost, consistent with the phased approach you've used for the rest of the product.

---

## Route structure

```
app/api/ingest/
  devto/route.ts
  hackernews/route.ts
  github/route.ts
  producthunt/route.ts
  process/route.ts       ← summarizes/scores newly fetched raw rows
```

One lightweight route per source (fetch + normalize + upsert raw data only — no LLM call here, to stay well under serverless timeout limits) plus a separate `process` route that picks up unprocessed rows in small batches and calls Claude for summary/category/tags. Splitting fetch from summarize matters because Vercel's default function timeout (10s on Hobby) can get tight if you fetch *and* call an LLM in the same request.

Every route checks a secret before doing anything:

```ts
// app/api/ingest/devto/route.ts
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const res = await fetch('https://dev.to/api/articles?tag=ai&top=7');
  const articles = await res.json();

  // normalize + upsert into Postgres via Drizzle (see schema below)
  // ...

  return Response.json({ ok: true, count: articles.length });
}
```

---

## Database schema additions (Drizzle)

Building on the `tools` table from your app spec:

```ts
// db/schema.ts
import { pgTable, text, integer, timestamp, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['pending_summary', 'published', 'archived']);

export const tools = pgTable('tools', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    category: text('category'),
    tags: jsonb('tags').$type<string[]>(),
    sourcePlatform: text('source_platform').notNull(),   // 'devto' | 'hackernews' | 'github' | 'producthunt'
    externalId: text('external_id').notNull(),            // the source's own ID/URL — used for dedup
    sourceUrl: text('source_url').notNull(),
    trendingScore: integer('trending_score').default(0),
    momentumHistory: jsonb('momentum_history').$type<{date: string; score: number}[]>().default([]),
    status: statusEnum('status').default('pending_summary'),
    firstSeenAt: timestamp('first_seen_at').defaultNow(),
    lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
}, (table) => ({
    sourceUnique: unique().on(table.sourcePlatform, table.externalId),
}));
```

The `unique(sourcePlatform, externalId)` constraint is what makes re-running the same ingest job safe — a Drizzle upsert (`onConflictDoUpdate`) updates the score and `lastUpdatedAt` on an existing row instead of creating a duplicate every time the cron fires.

```ts
await db.insert(tools)
    .values(normalizedItem)
    .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: { trendingScore: normalizedItem.trendingScore, lastUpdatedAt: new Date() },
    });
```

---

## GitHub Actions scheduler

```yaml
# .github/workflows/ingest.yml
name: Ingest tools
on:
  schedule:
    - cron: '0 * * * *'   # every hour, staggered per source below
  workflow_dispatch:        # lets you trigger manually while testing

jobs:
  devto:
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" https://yourdomain.com/api/ingest/devto

  hackernews:
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" https://yourdomain.com/api/ingest/hackernews

  github:
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" https://yourdomain.com/api/ingest/github

  process:
    needs: [devto, hackernews, github]
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" https://yourdomain.com/api/ingest/process
```

Set `INGEST_SECRET` once as both a Vercel environment variable and a GitHub Actions repo secret — same value in both places. `process` runs last (`needs:`) so it only summarizes after fresh data has landed.

---

## Full pipeline flow

1. **GitHub Actions fires** on schedule → hits each `/api/ingest/[source]` route
2. **Each route fetches** raw items from its source's API, normalizes them into a common shape
3. **Upsert into Postgres** via Drizzle, keyed on `(sourcePlatform, externalId)` — new items land as `pending_summary`, existing ones just get their score refreshed
4. **`/api/ingest/process` runs** — pulls a small batch of `pending_summary` rows, calls the Claude API for description/category/tags, flips status to `published`
5. **Frontend reads `published` rows only** — nothing half-processed ever reaches the homepage

## Notes

- Keep each source route processing a small batch per run (e.g. top 10-20 items) rather than everything available — cheaper, faster, and avoids one slow source blocking the rest.
- The `process` route is the one most likely to need `maxDuration` tuning if you batch-summarize many items — Next.js route handlers support `export const maxDuration = 60;` (Vercel Pro/Fluid compute required to exceed the Hobby default).
- Since Reddit needs manual approval, submit that application now even though you won't build against it yet — the 2-4 week wait is dead time you can absorb early rather than later.