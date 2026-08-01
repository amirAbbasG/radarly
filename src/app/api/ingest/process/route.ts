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

function buildPrompt(
  name: string,
  sourceUrl: string,
  platform: string,
): string {
  const label = sourceLabel(platform);
  return `You are categorizing an AI tool. Return ONLY valid JSON (no markdown):
{
  "hook": "one-line tagline under 120 chars",
  "description": "2-3 sentence description of what it does and why it matters",
  "category": "coding" | "design" | "productivity" | "data" | "audio-video",
  "tags": ["tag1", "tag2"],
  "website": "https://..."
}
Tool name: ${name}
Source: ${label}
Context URL: ${sourceUrl}`;
}

function parseLLMResponse(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/^```(json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function cleanResult(
  result: Record<string, unknown>,
  fallbacks: {
    hook?: string | null;
    description?: string | null;
    category?: string | null;
    tags?: string[];
    website?: string | null;
  },
) {
  return {
    hook: (result.hook as string) ?? fallbacks.hook,
    description: (result.description as string) ?? fallbacks.description,
    category: (result.category as string) ?? fallbacks.category,
    tags: (result.tags as string[]) ?? fallbacks.tags,
    website: (result.website as string) ?? fallbacks.website,
  };
}

async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<Record<string, unknown> | null> {
  try {
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
    if (json.error) return null;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseLLMResponse(text);
  } catch {
    return null;
  }
}

async function callMistral(
  prompt: string,
  apiKey: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    return parseLLMResponse(text);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const authError = verifyIngestAuth(req);
  if (authError) return authError;

  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "pending_summary"))
    .orderBy(asc(tools.firstSeenAt))
    .limit(50);

  console.log(`[process] found ${rows.length} pending tools`);

  let processed = 0;
  let geminiCount = 0;
  let mistralCount = 0;
  let fallbackCount = 0;

  for (const row of rows) {
    let hook = row.hook;
    let description = row.description;
    let category = row.category;
    let tags = row.tags ?? [];
    let website = row.website;

    if (!hook || !description) {
      const prompt = buildPrompt(row.name, row.sourceUrl, row.sourcePlatform);
      let result: Record<string, unknown> | null = null;

      if (process.env.GEMINI_API_KEY) {
        result = await callGemini(prompt, process.env.GEMINI_API_KEY);
        if (result) geminiCount++;
      }

      if (!result && process.env.MISTRAL_API_KEY) {
        result = await callMistral(prompt, process.env.MISTRAL_API_KEY);
        if (result) mistralCount++;
      }

      if (result) {
        const cleaned = cleanResult(result, {
          hook,
          description,
          category,
          tags,
          website,
        });
        hook = cleaned.hook;
        description = cleaned.description;
        category = cleaned.category;
        tags = cleaned.tags;
        website = cleaned.website;
      } else {
        hook = hook || fallbackHook(row.name, row.sourcePlatform);
        description =
          description || fallbackDescription(row.name, row.sourcePlatform);
        category = category || guessCategory(row.sourceUrl, row.sourcePlatform);
        website = website || row.sourceUrl;
        fallbackCount++;
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
        hook: hook ?? undefined,
        description: description ?? undefined,
        category: category ?? undefined,
        tags: tags ?? undefined,
        website: website ?? undefined,
        signal,
        momentumHistory: history,
        status: "published",
        lastUpdatedAt: new Date(),
      })
      .where(eq(tools.id, row.id));

    console.log(
      `[process] published | ${row.name} | cat=${category} | signal=${signal}`,
    );
    processed++;
  }

  let rescored = 0;
  const published = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(asc(tools.firstSeenAt));

  for (const row of published) {
    const hist =
      (row.momentumHistory as { date: string; score: number }[]) ?? [];
    const last = hist[hist.length - 1];
    const score = row.trendingScore ?? 0;
    // ponytail: skip append when last entry is < 6h old — avoids duplicate points from manual runs
    if (last && Date.now() - new Date(last.date).getTime() < 6 * 3600_000) {
      continue;
    }
    // no score change since last point → don't add a flat duplicate; recalc signal only
    if (last && last.score === score) {
      const sig = computeSignal(hist);
      if (sig !== (row.signal ?? "steady")) {
        await db.update(tools).set({ signal: sig }).where(eq(tools.id, row.id));
      }
      continue;
    }
    hist.push({ date: new Date().toISOString(), score });
    const signal = computeSignal(hist.slice(-12));
    await db
      .update(tools)
      .set({
        momentumHistory: hist.slice(-12),
        signal,
        lastUpdatedAt: new Date(),
      })
      .where(eq(tools.id, row.id));
    rescored++;
  }
  console.log(`[process] rescored ${rescored} published tools`);

  return Response.json({
    ok: true,
    processed,
    rescored,
    geminiCount,
    mistralCount,
    fallbackCount,
  });
}
