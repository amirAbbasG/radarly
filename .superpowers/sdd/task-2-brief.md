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
