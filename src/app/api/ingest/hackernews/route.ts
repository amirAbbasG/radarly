import { eq, and } from "drizzle-orm";
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

  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?query=AI+tool&tags=show_hn&hitsPerPage=15",
  );
  if (!res.ok) {
    console.error(`[hackernews] API error: ${res.status}`);
    return Response.json(
      { ok: false, source: "hackernews", error: `API returned ${res.status}` },
      { status: 502 },
    );
  }
  const data = await res.json();
  const hits: HNHit[] = data.hits ?? [];

  console.log(`[hackernews] fetched ${hits.length} hits`);

  let inserted = 0;
  for (const h of hits) {
    if (!h.title || !h.url) continue;
    const slug = h.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120);
    const score = Math.min(100, Math.round(h.points * 0.35));

    const existing = await db
      .select({ slug: tools.slug })
      .from(tools)
      .where(
        and(
          eq(tools.sourcePlatform, "hackernews"),
          eq(tools.externalId, h.objectID),
        ),
      )
      .limit(1);

    const action = existing.length > 0 ? "UPDATE" : "INSERT";

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
    console.log(
      `[hackernews] ${action} | score=${score} | ${h.title.slice(0, 80)}`,
    );
    inserted++;
  }

  return Response.json({ ok: true, source: "hackernews", count: inserted });
}
