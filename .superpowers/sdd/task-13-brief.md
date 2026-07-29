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
