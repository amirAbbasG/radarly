# Radarly — Data Ingestion Pipeline Design

**Date:** 2026-07-29  
**Status:** Approved

## Summary

Replace hardcoded mock tool data in `src/lib/tools-data.ts` with a real data pipeline that fetches AI tools from four free external sources, stores them in Neon Postgres, enriches them via Gemini Flash (free tier), and serves them to existing server components through direct DB queries. Zero cost. Configurable schedule via GitHub Actions.

---

## Architecture

```
GitHub Actions (configurable cron via INGEST_CRON repo variable, default 12h)
  │
  ├─→ GET /api/ingest/devto       — fetch + normalize + upsert (raw)
  ├─→ GET /api/ingest/hackernews   — fetch + normalize + upsert (raw)
  ├─→ GET /api/ingest/github       — fetch + normalize + upsert (raw)
  └─→ GET /api/ingest/producthunt  — fetch + normalize + upsert (raw)
                                    │
                              (new rows: pending_summary)
                                    │
  └─→ GET /api/ingest/process      — Gemini Flash summarize + score → published
              │
         Neon Postgres
              │
    src/lib/data.ts (DB queries, replaces mock tools-data.ts)
              │
    Server components: Home, /tools/[slug], /categories/[slug]
```

---

## Database — `tools` table (Drizzle + Neon)

Added to `src/lib/db/schema.ts`. Extends original ingestion plan schema with fields the frontend actually renders.

```ts
export const statusEnum = pgEnum("status", [
  "pending_summary",
  "published",
  "archived",
]);

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    hook: text("hook"), // one-line tagline
    description: text("description"), // about paragraph
    category: text("category"), // coding|design|productivity|data|audio-video
    tags: jsonb("tags").$type<string[]>(),
    sourcePlatform: text("source_platform").notNull(), // devto|hackernews|github|producthunt
    externalId: text("external_id").notNull(), // source's own ID for dedup
    sourceUrl: text("source_url").notNull(), // original post/repo/article
    website: text("website"), // tool's actual site
    trendingScore: integer("trending_score").default(0), // 0-100 momentum
    momentumHistory: jsonb("momentum_history")
      .$type<{ date: string; score: number }[]>()
      .default([]),
    signal: text("signal"), // rising|steady|hot
    status: statusEnum("status").default("pending_summary"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  },
  table => ({
    sourceUnique: unique().on(table.sourcePlatform, table.externalId),
  }),
);
```

`unique(sourcePlatform, externalId)` makes re-runs safe — upsert updates score/date on existing rows instead of creating duplicates.

### Future tables (not built now)

- `tool_votes` — user useful votes
- `tool_saves` — user bookmarks
- `tool_reviews` — user comments

---

## Scoring formula

Deterministic, runs in `process` route. Does NOT use LLM for scoring.

### Source → normalized score (0-100)

| Source       | Formula                          |
| ------------ | -------------------------------- |
| GitHub       | `min(100, log2(stars + 1) * 10)` |
| Hacker News  | `min(100, points * 0.35)`        |
| Dev.to       | `min(100, reactions * 0.8)`      |
| Product Hunt | `min(100, votes * 0.2)`          |

Multi-source tools: average across all sources that have seen it.

### Signal derivation

From `momentumHistory` (last 3 entries):

- Average score delta ≥ +15% → `"hot"`
- Average score delta ≥ +5% → `"rising"`
- Otherwise → `"steady"`

Lone tool (first cycle): defaults to `"steady"`.

### Sparkline

`momentumHistory` stores `{date: ISO string, score: number}[]`. Read as `tool.spark` in frontend (last 12 entries). If fewer than 2 entries, pad with the single score repeated.

---

## External sources (Phase 1 — all free)

| Source       | API                                                          | Auth              | Items per run | Build order |
| ------------ | ------------------------------------------------------------ | ----------------- | ------------- | ----------- |
| Dev.to       | `GET /api/articles?tag=ai&top=15`                            | None              | 15            | 1st         |
| Hacker News  | Algolia `search?query=Show+HN+AI&tags=show_hn`               | None              | 15            | 2nd         |
| GitHub       | `GET /search/repositories?q=ai+topic&sort=stars&per_page=15` | PAT (free, 5k/hr) | 15            | 3rd         |
| Product Hunt | GraphQL `posts{edges{node{...}}}`                            | OAuth dev token   | 15            | 4th         |

Phase 2 (deferred): Reddit (requires manual approval, 2-4 week wait), X/Twitter (paid).

---

## API routes

All under `src/app/api/ingest/`. Each requires `Authorization: Bearer <INGEST_SECRET>` header.

### `[source]/route.ts` (×4)

1. Verify `INGEST_SECRET`
2. `fetch()` from source API
3. Map response to normalized shape: `{ name, externalId, sourceUrl, sourcePlatform, trendingScore }`
4. Upsert via `db.insert(tools).values(...).onConflictDoUpdate(...)`
5. Return `{ ok: true, count, new: N }`

`export const maxDuration = 25;`

### `process/route.ts`

1. Verify `INGEST_SECRET`
2. `SELECT * FROM tools WHERE status = 'pending_summary' LIMIT 10`
3. For each tool: call Gemini Flash with prompt → returns `{ hook, description, category, tags, website }`
4. Compute `trendingScore` (scoring formula), append to `momentumHistory`, derive `signal`
5. `UPDATE tools SET ... status = 'published' WHERE id = $1`
6. Return `{ ok: true, processed: N }`

`export const maxDuration = 60;`

LLM prompt template:

```
You are categorizing an AI tool. Given the name and source context, return JSON:
{
  "hook": "one-line tagline (max 120 chars)",
  "description": "2-3 sentence description of what it does and why it matters",
  "category": "coding" | "design" | "productivity" | "data" | "audio-video",
  "tags": ["tag1", "tag2", "tag3"],
  "website": "https://..."
}
Tool name: {name}
Source: {sourcePlatform}
Context: {sourceUrl}
```

---

## GitHub Actions scheduler

```yaml
# .github/workflows/ingest.yml
name: Ingest tools
on:
  schedule:
    - cron: ${{ vars.INGEST_CRON || '0 */12 * * *' }}
  workflow_dispatch:

jobs:
  devto:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/devto"

  hackernews:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/hackernews"

  github:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/github"

  producthunt:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/producthunt"

  process:
    needs: [devto, hackernews, github, producthunt]
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/process"
```

**Config variables (GitHub repo):**

- `INGEST_CRON` — cron expression, default `0 */12 * * *` (every 12h). Change to `0 */6 * * *` for 6h.
- `APP_URL` — deployed Vercel URL

**Secrets (GitHub repo + Vercel env):**

- `INGEST_SECRET` — shared bearer token

---

## Frontend data layer

New file `src/lib/data.ts` — server-only, imports `db` from `src/lib/db`. Replaces `tools-data.ts` as the data source. `tools-data.ts` kept for type exports and re-exports.

### Type mapping (DB row → frontend types)

`Tool` type stays unchanged. Mapping:

| Tool field | DB column                                       |
| ---------- | ----------------------------------------------- |
| `name`     | `tools.name`                                    |
| `hook`     | `tools.hook`                                    |
| `cat`      | `tools.category`                                |
| `score`    | `tools.trending_score`                          |
| `sig`      | `tools.signal`                                  |
| `spark`    | `tools.momentum_history` → `.map(e => e.score)` |
| `source`   | `tools.source_platform` → display label         |

### Functions

```ts
getAllTools(): Promise<Tool[]>
  → SELECT * FROM tools WHERE status='published' ORDER BY trending_score DESC

getToolBySlug(slug: string): Promise<Tool | null>
  → SELECT * FROM tools WHERE slug=$1 AND status='published'

getCategoryTools(category: string): Promise<Tool[]>
  → SELECT * FROM tools WHERE category=$1 AND status='published' ORDER BY trending_score DESC

getRelatedTools(tool: Tool, limit?: number): Promise<Tool[]>
  → SELECT * FROM tools WHERE category=$1 AND id<>$2 AND status='published' ORDER BY trending_score DESC LIMIT $3

getCategoryProfiles(): Promise<CategoryProfile[]>
  → SELECT category, COUNT(*) FROM tools WHERE status='published' GROUP BY category
  → Mapped to CategoryProfile[] with accent, label, description from static config

getToolOfWeek(): Promise<Tool | null>
  → SELECT * FROM tools WHERE status='published' ORDER BY trending_score DESC LIMIT 1

getToolDetail(tool: Tool): ToolDetail
  → Pure function, same logic as current `getToolDetail()`, using real tool.name/hook/description
  → Generates: metrics, scoreBreakdown, reviews, highlights, bestFor, platforms
```

### Category profiles

Dynamic counts from DB. Static label/description/accent from a config map:

```ts
const CATEGORY_META: Record<string, Omit<CategoryProfile, 'count'>> = {
  coding: { id: 'code-development', label: 'Code & Development', description: '...', accent: 'primary', ... },
  design: { id: 'design-creative', label: 'Design & Creative', description: '...', accent: 'accent', ... },
  // ...
};
```

`getCategoryProfiles()` joins DB group-by counts with this static config. Categories with 0 published tools still show (count: 0).

---

## Pages — changes

All three pages stay server components. Change imports from `@/lib/tools-data` to `@/lib/data`.

### Home (`src/app/page.tsx`)

- `TrendingFeed` — reads `getAllTools()` instead of `TOOLS`
- `ToolOfWeek` — reads `getToolOfWeek()` instead of `TOOL_OF_WEEK`
- `Categories` — reads `getCategoryProfiles()` instead of hardcoded `CATS`
- `Hero` — wire live tool count from `getAllTools().length`

Components become async or accept props from parent server component.

### Tool detail (`src/app/tools/[slug]/page.tsx`)

- Drop `generateStaticParams()` — pages are dynamic (no build-time enumeration)
- `getToolBySlug(slug)` → DB query
- `getToolDetail(tool)` → same pure function
- `getRelatedTools(tool, 3)` → DB query
- Rank: computed as `allTools.findIndex(t => t.id === tool.id) + 1`

### Category (`src/app/categories/[slug]/page.tsx`)

- Drop `generateStaticParams()`
- `getCategoryProfiles().find(c => c.id === slug)` → live
- `getCategoryTools(category.toolCategory)` → DB query
- `getRelatedCategories()` → from `getCategoryProfiles()`

---

## Environment variables

```env
# Existing
DATABASE_URL=postgresql://...

# New — ingestion
INGEST_SECRET=<random-64-char>       # shared bearer between GH Actions and Vercel
GITHUB_TOKEN=ghp_...                 # GitHub PAT for search API (5k req/hr)
PRODUCTHUNT_TOKEN=...                # Product Hunt OAuth dev token
GEMINI_API_KEY=...                   # Gemini Flash free tier (1,500 req/day)
```

Add to `.env.example`.

---

## Files summary

| File                                      | Action                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/lib/db/schema.ts`                    | Add `tools` table + `statusEnum`                       |
| `src/lib/data.ts`                         | **New** — DB query layer                               |
| `src/lib/tools-data.ts`                   | Keep types, remove mock data, re-export data functions |
| `src/app/api/ingest/devto/route.ts`       | **New**                                                |
| `src/app/api/ingest/hackernews/route.ts`  | **New**                                                |
| `src/app/api/ingest/github/route.ts`      | **New**                                                |
| `src/app/api/ingest/producthunt/route.ts` | **New**                                                |
| `src/app/api/ingest/process/route.ts`     | **New**                                                |
| `.github/workflows/ingest.yml`            | **New**                                                |
| `src/app/page.tsx`                        | Switch to async, query DB                              |
| `src/app/tools/[slug]/page.tsx`           | Switch to async, query DB, drop generateStaticParams   |
| `src/app/categories/[slug]/page.tsx`      | Switch to async, query DB, drop generateStaticParams   |
| `src/features/home/hero.tsx`              | Accept live count prop                                 |
| `src/features/home/trending-feed.tsx`     | Accept tools/categories props                          |
| `src/features/home/tool-of-week.tsx`      | Accept tool prop                                       |
| `src/features/home/categories.tsx`        | Accept category profiles prop                          |
| `.env.example`                            | Add new env vars                                       |

---

## Cost analysis

| Component         | Tier               | Limit                 | Usage estimate  | Cost |
| ----------------- | ------------------ | --------------------- | --------------- | ---- |
| GitHub Actions    | Free (public repo) | 2,000 min/mo          | ~20 min/mo      | $0   |
| Dev.to API        | Free               | None                  | ~3,650 req/mo   | $0   |
| HN Algolia API    | Free               | None                  | ~3,650 req/mo   | $0   |
| GitHub Search API | Free authenticated | 5,000 req/hr          | ~3,650 req/mo   | $0   |
| Product Hunt API  | Free               | Reasonable polling    | ~3,650 req/mo   | $0   |
| Gemini Flash      | Free               | 1,500 req/day         | ~50 req/day max | $0   |
| Neon Postgres     | Free               | 0.5 GB, 100hr compute | <50 MB          | $0   |
| Vercel            | Hobby              | 100 GB bandwidth      | Under limit     | $0   |

**Total: $0/month**

---

## Risks & mitigations

| Risk                                                      | Mitigation                                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby 10s timeout on `process` route with LLM call | `maxDuration = 60`, process small batches (10 per run). If still timing out, split into per-tool chunks.                         |
| Gemini Flash rate limit (1,500/day)                       | Batch only on schedule. At 12h cadence with 4 sources, ~40-60 new tools/cycle max. Well under limit.                             |
| Source API changes                                        | Each ingest route is isolated — one source failing doesn't block others. `curl -fsS` in GH Actions surfaces errors.              |
| Empty DB on first deploy                                  | Pages show empty states gracefully. Hero shows "0 tools tracked" until first ingest run. `workflow_dispatch` for manual trigger. |
| Cold start latency                                        | DB queries are simple indexed lookups. Neon free tier scales to zero but wakes fast enough for SSR.                              |
