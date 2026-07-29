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
