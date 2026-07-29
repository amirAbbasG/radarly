import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { verifyIngestAuth, sourceLabel } from "@/lib/ingest-utils";

export const maxDuration = 60;

function computeSignal(history: { date: string; score: number }[]): string {
  if (history.length < 2) return "steady";
  const last3 = history.slice(-3);
  const deltas: number[] = [];
  for (let i = 1; i < last3.length; i++) {
    deltas.push(
      (last3[i].score - last3[i - 1].score) / Math.max(1, last3[i - 1].score),
    );
  }
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  if (avgDelta >= 0.15) return "hot";
  if (avgDelta >= 0.05) return "rising";
  return "steady";
}

function fallbackHook(name: string, platform: string): string {
  const label = sourceLabel(platform);
  return `${name} — trending AI tool on ${label}`;
}

function fallbackDescription(name: string, platform: string): string {
  const label = sourceLabel(platform);
  return `${name} is an AI tool that surfaced on ${label} and has been climbing the radar. We track its momentum across the sources that matter so you can decide whether it deserves a spot in your stack.`;
}

function guessCategory(sourceUrl: string, platform: string): string {
  const url = sourceUrl.toLowerCase();
  if (url.includes("github.com")) return "coding";
  if (url.includes("dev.to")) return "coding";
  if (platform === "producthunt") return "productivity";
  return "coding";
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const apiKey = process.env.GEMINI_API_KEY;

  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "pending_summary"))
    .orderBy(asc(tools.firstSeenAt))
    .limit(50);

  let processed = 0;
  let llmUsed = 0;
  let fallbackUsed = 0;

  for (const row of rows) {
    let hook = row.hook;
    let description = row.description;
    let category = row.category;
    let tags = row.tags ?? [];
    let website = row.website;

    if (!apiKey || (!hook && !description)) {
      try {
        if (apiKey) {
          const label = sourceLabel(row.sourcePlatform);
          const prompt = `You are categorizing an AI tool. Return ONLY valid JSON (no markdown):
{
  "hook": "one-line tagline under 120 chars",
  "description": "2-3 sentence description of what it does and why it matters",
  "category": "coding" | "design" | "productivity" | "data" | "audio-video",
  "tags": ["tag1", "tag2"],
  "website": "https://..."
}
Tool name: ${row.name}
Source: ${label}
Context URL: ${row.sourceUrl}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3,
                },
              }),
            },
          );

          const json = await res.json();

          if (!json.error) {
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            const cleaned = text
              .replace(/^```(json)?\s*/i, "")
              .replace(/\s*```$/, "")
              .trim();
            const result = JSON.parse(cleaned);
            hook = result.hook ?? hook;
            description = result.description ?? description;
            category = result.category ?? category;
            tags = result.tags ?? tags;
            website = result.website ?? website;
            llmUsed++;
          } else {
            throw new Error(json.error?.message ?? "API error");
          }
        } else {
          throw new Error("No API key");
        }
      } catch {
        hook = hook || fallbackHook(row.name, row.sourcePlatform);
        description =
          description || fallbackDescription(row.name, row.sourcePlatform);
        category = category || guessCategory(row.sourceUrl, row.sourcePlatform);
        website = website || row.sourceUrl;
        fallbackUsed++;
      }
    }

    const history =
      (row.momentumHistory as { date: string; score: number }[]) ?? [];
    const newEntry = {
      date: new Date().toISOString(),
      score: row.trendingScore ?? 0,
    };
    history.push(newEntry);
    const signal = computeSignal(history);

    await db
      .update(tools)
      .set({
        hook,
        description,
        category,
        tags,
        website,
        signal,
        momentumHistory: history,
        status: "published",
        lastUpdatedAt: new Date(),
      })
      .where(eq(tools.id, row.id));

    processed++;
  }

  return Response.json({ ok: true, processed, llmUsed, fallbackUsed });
}
