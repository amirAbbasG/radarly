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
    const slug = r.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 120);
    const score = Math.min(
      100,
      Math.round(Math.log2(r.stargazers_count + 1) * 10),
    );

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
