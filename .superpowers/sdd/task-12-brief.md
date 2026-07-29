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
