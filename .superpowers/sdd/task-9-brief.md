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