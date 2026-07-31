import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth } from "@/lib/ingest-utils";

export const maxDuration = 25;

interface DevtoArticle {
  title: string;
  url: string;
  description: string;
  positive_reactions_count: number;
  user: { profile_image: string };
  organization?: { profile_image: string };
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const res = await fetch(
    "https://dev.to/api/articles?tag=ai&per_page=15&top=7",
  );
  if (!res.ok) {
    console.error(`[devto] API error: ${res.status} ${res.statusText}`);
    return Response.json(
      { ok: false, source: "devto", error: `API returned ${res.status}` },
      { status: 502 },
    );
  }
  const articles: DevtoArticle[] = await res.json();

  console.log(`[devto] fetched ${articles.length} articles`);

  let inserted = 0;
  for (const a of articles) {
    const slug = a.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200);
    const score = Math.min(100, Math.round(a.positive_reactions_count * 0.8));

    const existing = await db
      .select({ slug: tools.slug })
      .from(tools)
      .where(
        and(eq(tools.sourcePlatform, "devto"), eq(tools.externalId, a.url)),
      )
      .limit(1);

    const action = existing.length > 0 ? "UPDATE" : "INSERT";

    await db
      .insert(tools)
      .values({
        id: crypto.randomUUID(),
        name: a.title,
        slug,
        sourcePlatform: "devto",
        externalId: a.url,
        sourceUrl: a.url,
        logo: a.organization?.profile_image ?? a.user?.profile_image ?? null,
        trendingScore: score,
      })
      .onConflictDoUpdate({
        target: [tools.sourcePlatform, tools.externalId],
        set: {
          trendingScore: score,
          logo: a.organization?.profile_image ?? a.user?.profile_image ?? null,
          lastUpdatedAt: new Date(),
        },
      });
    console.log(`[devto] ${action} | score=${score} | ${a.title.slice(0, 80)}`);
    inserted++;
  }

  return Response.json({ ok: true, source: "devto", count: inserted });
}
