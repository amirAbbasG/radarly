# Data Ingestion Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Replace hardcoded mock tool data with a real ingestion pipeline that fetches from 4 free sources, stores in Neon, enriches via Gemini Flash, and serves to existing server components.

**Architecture:** GitHub Actions cron triggers 4 source ingest routes (fetch + normalize + upsert), then a process route (Gemini Flash summarize + score to published). Server components query Postgres directly via `src/lib/data.ts`. Types kept in `tools-data.ts`, data replaced with DB queries.

**Tech Stack:** Next.js 16 route handlers, Drizzle ORM, Neon Postgres, Gemini Flash REST API, GitHub Actions.

## Global Constraints

- Zero cost (all free tiers)
- 12h cron default, configurable via `INGEST_CRON` GitHub repo variable
- Source APIs: Dev.to (no auth), HN Algolia (no auth), GitHub Search (PAT), Product Hunt (OAuth token)
- LLM: Gemini Flash free tier (1500 req/day), called via fetch() (no SDK dependency)
- Scoring: deterministic formulas per source, no LLM for scores
- Components: props-driven from parent server component pages
- generateStaticParams dropped for tool and category pages (dynamic SSR)
- Tool detail page metadata (reviews, highlights, scoreBreakdown) stays generated via getToolDetail() pure function

## File structure

```
src/
  lib/
    db/schema.ts          ++ tools table + statusEnum
    data.ts               NEW - DB query layer
    tools-data.ts         -- remove mock data, keep types+pure fns+re-exports
    ingest-utils.ts       NEW - verifyIngestAuth, sourceLabel
  app/
    api/ingest/
      devto/route.ts      NEW
      hackernews/route.ts NEW
      github/route.ts     NEW
      producthunt/route.ts NEW
      process/route.ts    NEW
    page.tsx              ** async, query DB
    tools/[slug]/page.tsx ** async, query DB, drop generateStaticParams
    categories/[slug]/page.tsx ** async, query DB, drop generateStaticParams
  features/home/
    hero.tsx              ** accept toolCount prop
    trending-feed.tsx     ** accept tools, categories props
    tool-of-week.tsx      ** accept tool prop
    categories.tsx        ** accept categoryProfiles prop
.github/workflows/
  ingest.yml              NEW
.env.example              ** add new env vars
```---

### Task 1: Database schema (tools table)

**Files:**
- Modify: src/lib/db/schema.ts

**Produces:** tools table, statusEnum

- [ ] **Step 1: Add tools table and statusEnum to schema.ts**

In src/lib/db/schema.ts, change the import at line 1 from:
```ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
```
to:
```ts
import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, unique } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending_summary", "published", "archived"]);

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    hook: text("hook"),
    description: text("description"),
    category: text("category"),
    tags: jsonb("tags").$type<string[]>(),
    sourcePlatform: text("source_platform").notNull(),
    externalId: text("external_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    website: text("website"),
    trendingScore: integer("trending_score").default(0),
    momentumHistory: jsonb("momentum_history")
      .$type<{ date: string; score: number }[]>()
      .default([]),
    signal: text("signal"),
    status: statusEnum("status").default("pending_summary"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  },
  (table) => ({
    sourceUnique: unique().on(table.sourcePlatform, table.externalId),
  }),
);
```

Keep the existing user, session, account, verification, toolSubmissions tables below, unchanged.

- [ ] **Step 2: Generate and run migration**
```bash
npx drizzle-kit generate; if ($?) { npx drizzle-kit migrate }
```
Expected: migration file created in drizzle/, "Migration complete".

- [ ] **Step 3: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add tools table and status enum to schema"
```

---

### Task 2: Shared ingest utilities

**Files:**
- Create: src/lib/ingest-utils.ts

**Produces:** verifyIngestAuth(), sourceLabel()

- [ ] **Step 1: Create src/lib/ingest-utils.ts**

```ts
export function verifyIngestAuth(req: Request): Response | null {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export function sourceLabel(platform: string): string {
  const map: Record<string, string> = {
    devto: "Dev.to",
    hackernews: "Hacker News",
    github: "GitHub",
    producthunt: "Product Hunt",
  };
  return map[platform] ?? platform;
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/ingest-utils.ts
git commit -m "feat: add shared ingest utility functions"
```

---

### Task 3: Data layer (src/lib/data.ts)

**Files:**
- Create: src/lib/data.ts

**Produces:** getAllTools(), getToolBySlug(), getCategoryTools(), getRelatedTools(), getCategoryProfiles(), getToolOfWeek(), getToolDetail()

**Consumes:** tools table (Task 1), Tool/CategoryProfile types (from tools-data.ts)

- [ ] **Step 1: Create src/lib/data.ts**

```ts
import "server-only";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { sourceLabel } from "@/lib/ingest-utils";
import type { Tool, ToolDetail, CategoryProfile } from "@/lib/tools-data";
import { CATEGORY_PROFILES } from "@/lib/tools-data";

function rowToTool(row: typeof tools.$inferSelect): Tool {
  const history = (row.momentumHistory as { date: string; score: number }[]) ?? [];
  return {
    name: row.name,
    hook: row.hook ?? "",
    cat: row.category ?? "coding",
    score: row.trendingScore ?? 0,
    sig: (row.signal as Tool["sig"]) ?? "steady",
    spark: history.slice(-12).map((e) => e.score),
    source: sourceLabel(row.sourcePlatform),
  };
}

export async function getAllTools(): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

export async function getCategoryTools(category: string): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, category))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getRelatedTools(tool: Tool, limit = 3): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, tool.cat))
    .limit(limit + 1);
  return rows
    .filter((r) => r.name !== tool.name)
    .slice(0, limit)
    .map(rowToTool);
}

export async function getCategoryProfiles(): Promise<CategoryProfile[]> {
  const rows = await db
    .select({
      category: tools.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(tools)
    .where(eq(tools.status, "published"))
    .groupBy(tools.category);

  const countMap = new Map<string, number>();
  for (const r of rows) {
    if (r.category) countMap.set(r.category, r.count);
  }

  return CATEGORY_PROFILES.map((profile) => ({
    ...profile,
    count: countMap.get(profile.toolCategory) ?? 0,
  }));
}

export async function getToolOfWeek(): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

export { getToolDetail } from "@/lib/tools-data";
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/data.ts
git commit -m "feat: add data layer with DB query functions"
```

---

### Task 4: Refactor tools-data.ts (types only, no mock data)

**Files:**
- Modify: src/lib/tools-data.ts

**Produces:** type exports, CATEGORIES, CATEGORY_LABELS, CATEGORY_PROFILES, toolSlug(), getToolDetail()

- [ ] **Step 1: Remove mock data arrays, keep types and pure functions**

In src/lib/tools-data.ts, delete:
- The `spark()` function (lines 140-148)
- The `TOOLS` array (lines 150-349)
- The `getToolBySlug()` and `getRelatedTools()` functions (lines 358-368)
- The `TOOL_OF_WEEK` object (lines 532-543)
- The `SOURCES` array (lines 545-552)

Keep everything else: type definitions (Tool, Signal, Category, CategoryProfile, ToolDetail), CATEGORIES array, CATEGORY_PROFILES array, CATEGORY_LABELS, toolSlug(), getToolDetail(), getCategoryProfile(), getCategoryTools(), getRelatedCategories(), hash().

Add this re-export at the end of the file:
```ts
export { getAllTools, getToolBySlug, getCategoryTools, getRelatedTools, getCategoryProfiles, getToolOfWeek, getToolDetail } from "./data";
```

- [ ] **Step 2: Verify TypeScript (both tools-data.ts and data.ts)**
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add src/lib/tools-data.ts
git commit -m "refactor: remove mock data, re-export from data layer"
```

---

### Task 5: Dev.to ingest route

**Files:**
- Create: src/app/api/ingest/devto/route.ts

**Consumes:** verifyIngestAuth (Task 2), tools table (Task 1)

- [ ] **Step 1: Create directory and route file**
```bash
$null = New-Item -ItemType Directory -Path "src/app/api/ingest/devto" -Force
```

```ts
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 25;

interface DevtoArticle {
  title: string;
  url: string;
  description: string;
  positive_reactions_count: number;
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const res = await fetch("https://dev.to/api/articles?tag=ai&per_page=15&top=7");
  const articles: DevtoArticle[] = await res.json();

  let inserted = 0;
  for (const a of articles) {
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
    const score = Math.min(100, Math.round(a.positive_reactions_count * 0.8));

    await db
      .insert(tools)
      .values({
        id: crypto.randomUUID(),
        name: a.title,
        slug,
        sourcePlatform: "devto",
        externalId: a.url,
        sourceUrl: a.url,
        trendingScore: score,
      })
      .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: { trendingScore: score, lastUpdatedAt: new Date() },
      });
    inserted++;
  }

  return Response.json({ ok: true, source: "devto", count: inserted });
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/ingest/devto/route.ts
git commit -m "feat: add Dev.to ingest route"
```

---

### Task 6: Hacker News ingest route

**Files:**
- Create: src/app/api/ingest/hackernews/route.ts

- [ ] **Step 1: Create directory and route file**
```bash
$null = New-Item -ItemType Directory -Path "src/app/api/ingest/hackernews" -Force
```

```ts
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 25;

interface HNHit {
  title: string;
  url?: string;
  points: number;
  objectID: string;
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const res = await fetch("https://hn.algolia.com/api/v1/search?query=AI+tool&tags=show_hn&hitsPerPage=15");
  const data = await res.json();
  const hits: HNHit[] = data.hits ?? [];

  let inserted = 0;
  for (const h of hits) {
    if (!h.title || !h.url) continue;
    const slug = h.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
    const score = Math.min(100, Math.round(h.points * 0.35));

    await db
      .insert(tools)
      .values({
        id: crypto.randomUUID(),
        name: h.title.replace(/^Show HN:\s*/i, ""),
        slug,
        sourcePlatform: "hackernews",
        externalId: h.objectID,
        sourceUrl: h.url,
        trendingScore: score,
      })
      .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: { trendingScore: score, lastUpdatedAt: new Date() },
      });
    inserted++;
  }

  return Response.json({ ok: true, source: "hackernews", count: inserted });
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/ingest/hackernews/route.ts
git commit -m "feat: add Hacker News ingest route"
```

---

### Task 7: GitHub ingest route

**Files:**
- Create: src/app/api/ingest/github/route.ts

- [ ] **Step 1: Create directory and route file**
```bash
$null = New-Item -ItemType Directory -Path "src/app/api/ingest/github" -Force
```

```ts
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 25;

interface GHRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    "https://api.github.com/search/repositories?q=topic:ai&sort=stars&order=desc&per_page=15",
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "User-Agent": "radarly",
      },
    },
  );
  const data = await res.json();
  const repos: GHRepo[] = data.items ?? [];

  let inserted = 0;
  for (const r of repos) {
    const slug = r.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120);
    const score = Math.min(100, Math.round(Math.log2(r.stargazers_count + 1) * 10));

    await db
      .insert(tools)
      .values({
        id: crypto.randomUUID(),
        name: r.full_name,
        slug,
        sourcePlatform: "github",
        externalId: String(r.id),
        sourceUrl: r.html_url,
        website: r.html_url,
        trendingScore: score,
      })
      .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: { trendingScore: score, lastUpdatedAt: new Date() },
      });
    inserted++;
  }

  return Response.json({ ok: true, source: "github", count: inserted });
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/ingest/github/route.ts
git commit -m "feat: add GitHub ingest route"
```

---

### Task 8: Product Hunt ingest route

**Files:**
- Create: src/app/api/ingest/producthunt/route.ts

- [ ] **Step 1: Create directory and route file**
```bash
$null = New-Item -ItemType Directory -Path "src/app/api/ingest/producthunt" -Force
```

```ts
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 25;

const QUERY = `
  query {
    posts(first: 15, topic: "artificial-intelligence", order: VOTES) {
      edges {
        node {
          id
          name
          tagline
          url
          website
          votesCount
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const token = process.env.PRODUCTHUNT_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: "PRODUCTHUNT_TOKEN not set" }, { status: 500 });
  }

  const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY }),
  });

  const json = await res.json();
  const nodes: { id: string; name: string; tagline: string; url: string; website: string; votesCount: number }[] =
    json.data?.posts?.edges?.map((e: { node: unknown }) => e.node) ?? [];

  let inserted = 0;
  for (const p of nodes) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
    const score = Math.min(100, Math.round(p.votesCount * 0.2));

    await db
      .insert(tools)
      .values({
        id: crypto.randomUUID(),
        name: p.name,
        slug,
        hook: p.tagline,
        sourcePlatform: "producthunt",
        externalId: p.id,
        sourceUrl: p.url,
        website: p.website || p.url,
        trendingScore: score,
      })
      .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: { trendingScore: score, lastUpdatedAt: new Date() },
      });
    inserted++;
  }

  return Response.json({ ok: true, source: "producthunt", count: inserted });
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/ingest/producthunt/route.ts
git commit -m "feat: add Product Hunt ingest route"
```

---

### Task 10: GitHub Actions workflow

**Files:**
- Create: .github/workflows/ingest.yml

- [ ] **Step 1: Create directory and workflow file**
```bash
$null = New-Item -ItemType Directory -Path ".github/workflows" -Force
```

```yaml
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

**GitHub repo setup required:**
- Secrets: `INGEST_SECRET`
- Variables: `INGEST_CRON` (defaults to `0 */12 * * *`), `APP_URL` (your Vercel deployment URL)

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/ingest.yml
git commit -m "feat: add GitHub Actions ingest workflow"
```

---

### Task 11: Update home page + feature components

**Files:**
- Modify: src/app/page.tsx
- Modify: src/features/home/hero.tsx
- Modify: src/features/home/trending-feed.tsx
- Modify: src/features/home/tool-of-week.tsx
- Modify: src/features/home/categories.tsx

**Key changes:** Page becomes async, fetches data, passes as props. Components accept props instead of reading globals.

- [ ] **Step 1: Update src/app/page.tsx**

Make the page async and fetch data. Pass as props to child components.

```tsx
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/features/home/hero";
import { TrustStrip } from "@/features/home/trust-strip";
import { ToolOfWeek } from "@/features/home/tool-of-week";
import { TrendingFeed } from "@/features/home/trending-feed";
import { HowItWorks } from "@/features/home/how-it-works";
import { Categories } from "@/features/home/categories";
import { Newsletter } from "@/features/home/newsletter";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { getAllTools, getToolOfWeek, getCategoryProfiles } from "@/lib/data";
import { CATEGORIES } from "@/lib/tools-data";

export default async function Page() {
  const [allTools, toolOfWeek, categoryProfiles] = await Promise.all([
    getAllTools(),
    getToolOfWeek(),
    getCategoryProfiles(),
  ]);

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero toolCount={allTools.length} />
        <TrustStrip />
        <ToolOfWeek tool={toolOfWeek} />
        <TrendingFeed tools={allTools} categories={CATEGORIES} />
        <HowItWorks />
        <Categories categoryProfiles={categoryProfiles} />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Update src/features/home/hero.tsx**

Accept toolCount prop. Replace hardcoded "1680" with the prop.

Change the component signature from:
```tsx
export function Hero() {
```
to:
```tsx
export function Hero({ toolCount = 0 }: { toolCount?: number }) {
```

And change the stat array from:
```tsx
{ n: 1680, s: "+", l: "Tools tracked" },
```
to:
```tsx
{ n: toolCount, s: "", l: "Tools tracked" },
```

No other changes to hero.tsx. Rest of the component stays identical.

- [ ] **Step 3: Update src/features/home/trending-feed.tsx**

Accept tools and categories as props instead of importing TOOLS/CATEGORIES from tools-data.ts.

**Import changes:**
- Remove: `import { CATEGORIES, TOOLS } from "@/lib/tools-data";`
- Add: `import type { Tool, Category } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function TrendingFeed() {
```
to:
```tsx
export function TrendingFeed({ tools, categories }: { tools: Tool[]; categories: Category[] }) {
```

**Body changes:**
- Replace `TOOLS` references with `tools`
- Replace `CATEGORIES` references with `categories`

Specifically:
- Line 23: `let list = tools.filter(...)` (was `TOOLS.filter(...)`)
- Line 71: `{categories.map(...)}` (was `{CATEGORIES.map(...)}`)

No other changes needed.

- [ ] **Step 4: Update src/features/home/tool-of-week.tsx**

Accept tool prop instead of importing TOOL_OF_WEEK.

**Import changes:**
- Remove: `import { TOOL_OF_WEEK } from "@/lib/tools-data";`
- Add: `import type { Tool } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function ToolOfWeek() {
  const t = TOOL_OF_WEEK;
```
to:
```tsx
export function ToolOfWeek({ tool }: { tool: Tool | null }) {
  if (!tool) return null;
  const t = tool;
```

**Stats section:** Replace `t.stats` (which only exists on TOOL_OF_WEEK mock object) with derived stats from the Tool type:

```tsx
const stats = [
  { label: "Momentum", value: String(t.score) },
  { label: "Signal", value: t.sig.charAt(0).toUpperCase() + t.sig.slice(1) },
  { label: "Source", value: t.source },
];
```

Use `{stats.map(...)}` instead of `{t.stats.map(...)}` in the JSX.

- [ ] **Step 5: Update src/features/home/categories.tsx**

Accept categoryProfiles prop instead of hardcoded CATS array.

**Import changes:**
- Add: `import type { CategoryProfile } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function Categories() {
```
to:
```tsx
export function Categories({ categoryProfiles }: { categoryProfiles: CategoryProfile[] }) {
```

**Remove the hardcoded CATS constant** (lines 22-79 in current file). Replace with icon and color maps:

```tsx
import {
  Code2, PenLine, Palette, Zap, BarChart3, Megaphone, ImageIcon, Video,
} from "lucide-react";

const ICON_MAP: Record<string, typeof Code2> = {
  "code-development": Code2,
  "writing-content": PenLine,
  "design-creative": Palette,
  productivity: Zap,
  "data-analytics": BarChart3,
  "marketing-seo": Megaphone,
  "image-generation": ImageIcon,
  "video-audio": Video,
};

const COLOR_MAP: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  secondary: "text-secondary bg-secondary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};
```

Add mapping inside the component:
```tsx
const cats = categoryProfiles.map((c) => ({
  name: c.label,
  slug: c.id,
  count: c.count,
  icon: ICON_MAP[c.id] ?? Zap,
  color: COLOR_MAP[c.accent] ?? "text-secondary bg-secondary/10",
}));
```

Replace `{CATS.map(...)}` with `{cats.map(...)}` in the JSX.

- [ ] **Step 6: Verify TypeScript**
```bash
npx tsc --noEmit
```
Expected: clean, no errors. Fix any type mismatches.

- [ ] **Step 7: Commit**
```bash
git add src/app/page.tsx src/features/home/
git commit -m "feat: wire home page and components to DB data"
```

---

### Task 12: Update tool detail page

**Files:**
- Modify: src/app/tools/[slug]/page.tsx

- [ ] **Step 1: Update the page to query DB, drop generateStaticParams**

Replace the entire file content:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToolDetail } from "@/features/tool-detail/tool-detail";
import { getToolBySlug, getRelatedTools, getAllTools } from "@/lib/data";
import { getToolDetail } from "@/lib/tools-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool not found - Radarly" };
  return {
    title: `${tool.name} - Radarly`,
    description: tool.hook,
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const [detail, related, allTools] = await Promise.all([
    Promise.resolve(getToolDetail(tool)),
    getRelatedTools(tool, 3),
    getAllTools(),
  ]);

  const rank = allTools.findIndex((t) => t.name === tool.name) + 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar showLinks={false} />
      <main>
        <ToolDetail tool={tool} detail={detail} related={related} rank={rank} />
      </main>
      <Footer />
    </div>
  );
}
```

Key changes:
- Remove `generateStaticParams()` (pages become dynamic)
- Page is now async
- `getToolBySlug()` is now async (DB query)
- `getToolDetail()` remains synchronous pure function
- `getRelatedTools()` is now async (DB query)
- Rank computed from `getAllTools()` instead of `TOOLS.findIndex()`

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/tools/[slug]/page.tsx
git commit -m "feat: wire tool detail page to DB queries"
```

---

### Task 13: Update category page

**Files:**
- Modify: src/app/categories/[slug]/page.tsx

- [ ] **Step 1: Update the page to query DB, drop generateStaticParams**

Replace the entire file content:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryExperience } from "@/features/category/category-experience";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCategoryProfiles, getCategoryTools } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profiles = await getCategoryProfiles();
  const category = profiles.find((c) => c.id === slug);
  if (!category) return {};
  return {
    title: `${category.label} tools - Radarly`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profiles = await getCategoryProfiles();
  const category = profiles.find((c) => c.id === slug);
  if (!category) notFound();

  const tools = await getCategoryTools(category.toolCategory);
  const relatedProfiles = profiles.filter((c) => c.id !== slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <CategoryExperience
        category={category}
        tools={tools}
        relatedCategories={relatedProfiles}
      />
      <Footer />
    </main>
  );
}
```

Key changes:
- Remove `generateStaticParams()`
- Page is now async
- `getCategoryProfiles()` is async (DB-backed)
- `getCategoryTools()` is async (DB query)
- Related categories derived inline from profiles list

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/categories/[slug]/page.tsx
git commit -m "feat: wire category page to DB queries"
```

---

### Task 14: Environment variables and final verification

**Files:**
- Modify: .env.example (create if missing)
- Modify: .env (add new vars)

- [ ] **Step 1: Create/update .env.example**

```env
# Database
DATABASE_URL=postgresql://...

# Ingestion
INGEST_SECRET=  # Random string, shared between GH Actions secrets and Vercel env
GITHUB_TOKEN=   # GitHub personal access token (for search API, 5k req/hr free)
PRODUCTHUNT_TOKEN=  # Product Hunt OAuth developer token
GEMINI_API_KEY=  # Google AI Studio API key (Gemini Flash free tier)
```

- [ ] **Step 2: Add new vars to .env**

Append to the existing .env:
```env
INGEST_SECRET=dev-secret-change-me
GITHUB_TOKEN=
PRODUCTHUNT_TOKEN=
GEMINI_API_KEY=
```

- [ ] **Step 3: Full TypeScript check**
```bash
npx tsc --noEmit
```
Expected: clean, no errors across all modified files.

- [ ] **Step 4: Verify app builds**

The app should build cleanly with dynamic pages:
```bash
npx next build
```
Expected: successful build. May show warnings about missing env vars (ignore for dev). No static generation errors since generateStaticParams was removed.

- [ ] **Step 5: Test empty state locally**

Start dev server and visit pages. With empty DB, pages should show empty/zero states gracefully (0 tools tracked, no tool of week, empty category pages).

- [ ] **Step 6: Commit**
```bash
git add .env.example .env
git commit -m "chore: add ingestion environment variables"
```

---

## Optional: Dev seed script

To manually test the ingest flow locally before deploying:

```bash
# Set INGEST_SECRET in .env first
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/devto
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/hackernews
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/process
```

Or trigger all at once by calling individual routes, then process.

---

## Post-implementation checklist

After all code is merged and deployed:

- [ ] GitHub repo secrets set: `INGEST_SECRET`
- [ ] GitHub repo variables set: `INGEST_CRON` (e.g. `0 */12 * * *`), `APP_URL` (Vercel deployment URL)
- [ ] Vercel environment variables set: `INGEST_SECRET`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, `PRODUCTHUNT_TOKEN`
- [ ] DB migration applied to Neon production branch (`npx drizzle-kit migrate`)
- [ ] Manual ingest test via GitHub Actions `workflow_dispatch` succeeds
- [ ] Home page shows real tools from DB (not hardcoded)
- [ ] Tool detail pages load by slug
- [ ] Category pages show correct counts grouped by category
- [ ] Cron schedule fires on configured interval
---

### Task 9: Process route (Gemini Flash summarization + scoring)

**Files:**
- Create: src/app/api/ingest/process/route.ts

**Consumes:** tools table (Task 1), GEMINI_API_KEY env var

- [ ] **Step 1: Create directory and route file**
```bash
$null = New-Item -ItemType Directory -Path "src/app/api/ingest/process" -Force
```

```ts
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 60;

const PROMPT = `You are categorizing an AI tool. Given the name and source context, return ONLY valid JSON (no markdown, no explanation):
{
  "hook": "one-line tagline under 120 chars",
  "description": "2-3 sentence description of what it does and why it matters",
  "category": "coding" | "design" | "productivity" | "data" | "audio-video",
  "tags": ["tag1", "tag2", "tag3"],
  "website": "https://..."
}
Tool name: {name}
Source: {source}
Context URL: {url}`;

function computeSignal(history: { date: string; score: number }[]): string {
  if (history.length < 2) return "steady";
  const last3 = history.slice(-3);
  const deltas: number[] = [];
  for (let i = 1; i < last3.length; i++) {
    deltas.push((last3[i].score - last3[i - 1].score) / Math.max(1, last3[i - 1].score));
  }
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  if (avgDelta >= 0.15) return "hot";
  if (avgDelta >= 0.05) return "rising";
  return "steady";
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "pending_summary"))
    .orderBy(asc(tools.firstSeenAt))
    .limit(10);

  let processed = 0;
  for (const row of rows) {
    try {
      const prompt = PROMPT
        .replace("{name}", row.name)
        .replace("{source}", row.sourcePlatform)
        .replace("{url}", row.sourceUrl);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
          }),
        },
      );
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const result = JSON.parse(text.trim());

      const history = (row.momentumHistory as { date: string; score: number }[]) ?? [];
      const newEntry = { date: new Date().toISOString(), score: row.trendingScore ?? 0 };
      history.push(newEntry);
      const signal = computeSignal(history);

      await db
        .update(tools)
        .set({
          hook: result.hook ?? row.hook,
          description: result.description ?? row.description,
          category: result.category ?? "coding",
          tags: result.tags ?? [],
          website: result.website ?? row.website,
          signal,
          momentumHistory: history,
          status: "published",
          lastUpdatedAt: new Date(),
        })
        .where(eq(tools.id, row.id));

      processed++;
    } catch (err) {
      console.error("Process failed for", row.name, err);
    }
  }

  return Response.json({ ok: true, processed });
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/ingest/process/route.ts
git commit -m "feat: add process route with Gemini Flash summarization"
```
