# SEO Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete SEO infrastructure to Radarly — robots.txt, sitemap, canonical tags, structured data, AI bot access, and machine-readable files for AI search engines.

**Architecture:** Add Next.js App Router metadata exports (`robots.ts`, `sitemap.ts`) and JSON-LD structured data in existing layout/page files. Add `llms.txt` and `robots.txt` AI bot configuration. No new dependencies needed — all changes use Next.js built-in metadata API.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19

## Global Constraints

- Next.js 16 App Router conventions (metadata exports, not `<head>` tags)
- No new dependencies — use only what's in package.json
- Replace `https://radarly.app` with actual domain when known
- All file paths relative to `src/app/` unless noted

---

## File Structure

| File                                       | Action | Purpose                                   |
| ------------------------------------------ | ------ | ----------------------------------------- |
| `src/app/robots.ts`                        | Create | robots.txt with AI bot access             |
| `src/app/sitemap.ts`                       | Create | Dynamic XML sitemap                       |
| `src/app/layout.tsx`                       | Modify | Add metadataBase, twitter card, canonical |
| `src/app/tools/[slug]/page.tsx`            | Modify | Add canonical, OG metadata, JSON-LD       |
| `src/app/categories/[slug]/page.tsx`       | Modify | Add canonical, OG metadata, JSON-LD       |
| `src/app/about/page.tsx`                   | Modify | Add FAQPage JSON-LD                       |
| `src/app/not-found.tsx`                    | Create | Custom 404 page                           |
| `src/app/newsletter/unsubscribed/page.tsx` | Modify | Add metadata                              |
| `public/llms.txt`                          | Create | AI context file                           |
| `src/components/common/tool-avatar.tsx`    | Modify | Fix empty alt text                        |

---

### Task 1: Create robots.txt with AI Bot Access

**Files:**

- Create: `src/app/robots.ts`

**Interfaces:**

- Consumes: nothing (standalone)
- Produces: `/robots.txt` route via Next.js metadata API

- [ ] **Step 1: Create robots.ts**

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://radarly.app/sitemap.xml",
  };
}
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit src/app/robots.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt with AI bot access"
```

---

### Task 2: Create Dynamic XML Sitemap

**Files:**

- Create: `src/app/sitemap.ts`

**Interfaces:**

- Consumes: `getAllTools()` from `@/lib/data`, `getCategoryProfiles()` from `@/lib/data`
- Produces: `/sitemap.xml` route via Next.js metadata API

- [ ] **Step 1: Create sitemap.ts**

```typescript
import type { MetadataRoute } from "next";
import { getAllTools, getCategoryProfiles } from "@/lib/data";

const BASE_URL = "https://radarly.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tools, categories] = await Promise.all([
    getAllTools(),
    getCategoryProfiles(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = tools.map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: tool.lastUpdatedAt
      ? new Date(tool.lastUpdatedAt)
      : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE_URL}/categories/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...toolPages, ...categoryPages];
}
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit src/app/sitemap.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add dynamic XML sitemap for tools and categories"
```

---

### Task 3: Add metadataBase and Twitter Card to Root Layout

**Files:**

- Modify: `src/app/layout.tsx:27-46`

**Interfaces:**

- Consumes: nothing
- Produces: updated metadata export with metadataBase and twitter field

- [ ] **Step 1: Update metadata export in layout.tsx**

Replace the existing `metadata` export (lines 27-46) with:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://radarly.app"),
  title: "Radarly — Discover What's Rising in AI",
  description:
    "An AI agent scans Product Hunt, GitHub, Hacker News and Reddit every day, scores real momentum, and surfaces the AI tools that are actually taking off. Scan what matters in under 10 seconds.",
  generator: "v0.app",
  keywords: [
    "AI tools",
    "trending AI",
    "Product Hunt",
    "AI directory",
    "developer tools",
    "indie hackers",
  ],
  openGraph: {
    title: "Radarly — Discover What's Rising in AI",
    description:
      "The signal, not the noise. Trending AI tools ranked by real momentum, refreshed daily.",
    type: "website",
    siteName: "Radarly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radarly — Discover What's Rising in AI",
    description:
      "The signal, not the noise. Trending AI tools ranked by real momentum, refreshed daily.",
  },
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add metadataBase, siteName, and twitter card to root layout"
```

---

### Task 4: Add Canonical Tags and JSON-LD to Tool Detail Pages

**Files:**

- Modify: `src/app/tools/[slug]/page.tsx:17-29`

**Interfaces:**

- Consumes: tool data from `getToolBySlug()`
- Produces: updated metadata with canonical, OG, and JSON-LD script tag

- [ ] **Step 1: Update generateMetadata in tools/[slug]/page.tsx**

Replace the existing `generateMetadata` function (lines 17-29) with:

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool not found - Radarly" };

  const url = `https://radarly.app/tools/${tool.slug}`;

  return {
    title: `${tool.name} — Trending AI Tool | Radarly`,
    description: tool.hook,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tool.name} — Trending AI Tool | Radarly`,
      description: tool.hook,
      type: "website",
      url,
      siteName: "Radarly",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — Trending AI Tool | Radarly`,
      description: tool.hook,
    },
  };
}
```

- [ ] **Step 2: Add JSON-LD script tag to the page component**

In the same file, add a JSON-LD script tag inside the returned JSX. Add it as the first child inside the outer `<div>`:

```typescript
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [detail, related, allTools, interactionState, reviews] =
    await Promise.all([
      Promise.resolve(getToolDetail(tool)),
      getRelatedTools(tool, 3),
      getAllTools(),
      getToolInteractionState(slug),
      getToolReviews(slug, userId),
    ]);

  const rank = allTools.findIndex((t) => t.name === tool.name) + 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.hook,
    url: tool.website,
    applicationCategory: "AI Tool",
    offers: {
      "@type": "Offer",
      price: detail.pricing === "Free" ? "0" : undefined,
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.score,
      ratingCount: interactionState.voteCount + 1,
      bestRating: 100,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar showLinks={false} />
      {/* ... rest of existing JSX */}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/tools/[slug]/page.tsx
git commit -m "feat: add canonical tags and SoftwareApplication JSON-LD to tool pages"
```

---

### Task 5: Add Canonical Tags and JSON-LD to Category Pages

**Files:**

- Modify: `src/app/categories/[slug]/page.tsx:8-21`

**Interfaces:**

- Consumes: category data from `getCategoryProfiles()`
- Produces: updated metadata with canonical, OG, and JSON-LD script tag

- [ ] **Step 1: Update generateMetadata in categories/[slug]/page.tsx**

Replace the existing `generateMetadata` function (lines 8-21) with:

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profiles = await getCategoryProfiles();
  const category = profiles.find(c => c.id === slug);
  if (!category) return {};

  const url = `https://radarly.app/categories/${category.id}`;

  return {
    title: `${category.label} AI Tools — Radarly`,
    description: category.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${category.label} AI Tools — Radarly`,
      description: category.description,
      type: "website",
      url,
      siteName: "Radarly",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.label} AI Tools — Radarly`,
      description: category.description,
    },
  };
}
```

- [ ] **Step 2: Add JSON-LD script tag to the page component**

In the same file, add a JSON-LD script tag inside the returned JSX:

```typescript
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.label} AI Tools`,
    description: category.description,
    url: `https://radarly.app/categories/${category.id}`,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 10).map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.hook,
        url: `https://radarly.app/tools/${tool.slug}`,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      {/* ... rest of existing JSX */}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/categories/[slug]/page.tsx
git commit -m "feat: add canonical tags and ItemList JSON-LD to category pages"
```

---

### Task 6: Add FAQPage JSON-LD to About Page

**Files:**

- Modify: `src/app/about/page.tsx`

**Interfaces:**

- Consumes: nothing (static FAQ data)
- Produces: JSON-LD script tag for FAQ section

- [ ] **Step 1: Add JSON-LD to about page**

Replace the existing `AboutRoute` component:

```typescript
export default function AboutRoute() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Radarly rank AI tools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly uses an AI agent that scans Product Hunt, GitHub, Hacker News, and Reddit daily. It scores real momentum based on discussion volume, velocity of mentions, community engagement, and retention signals. Tools are ranked by a composite momentum score out of 100.",
        },
      },
      {
        "@type": "Question",
        name: "How often is the data updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly scans its four source platforms every 24 hours. Momentum scores, rankings, and trending status are refreshed daily so you always see what's actually taking off right now.",
        },
      },
      {
        "@type": "Question",
        name: "Can I submit my own AI tool to Radarly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Radarly accepts tool submissions from builders and founders. Submit your tool through the Submit page and the editorial team will review it for inclusion in the next scan cycle.",
        },
      },
      {
        "@type": "Question",
        name: "What sources does Radarly track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly tracks four primary sources: Product Hunt launches, GitHub repository activity, Hacker News discussions, and Reddit communities. Each source contributes different signals to the overall momentum score.",
        },
      },
    ],
  };

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <AboutPage />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add FAQPage JSON-LD to about page"
```

---

### Task 7: Create Custom 404 Page

**Files:**

- Create: `src/app/not-found.tsx`

**Interfaces:**

- Consumes: nothing
- Produces: branded 404 page with navigation back to main content

- [ ] **Step 1: Create not-found.tsx**

```typescript
import Link from "next/link";
import { Radar } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-3xl border border-border bg-card px-8 py-16">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary/10">
          <Radar className="size-8 text-secondary" />
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          404 — Signal lost
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The page you&apos;re looking for isn&apos;t on our radar. It may have
          been moved, or it never existed.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Back to radar
          </Link>
          <Link
            href="/about"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-secondary hover:text-secondary"
          >
            Learn more
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: add custom 404 page"
```

---

### Task 8: Add Metadata to Newsletter Unsubscribed Page

**Files:**

- Modify: `src/app/newsletter/unsubscribed/page.tsx`

**Interfaces:**

- Consumes: nothing
- Produces: metadata export for the page

- [ ] **Step 1: Add metadata export**

Add a metadata export to the top of the file, after imports:

```typescript
import type { Metadata } from "next";
import { MailX } from "lucide-react";

export const metadata: Metadata = {
  title: "Unsubscribed — Radarly",
  description:
    "You've been unsubscribed from The Sunday Signal. No further action needed.",
};
```

Then update the default export to use the named export:

```typescript
export default function UnsubscribedPage() {
```

(Note: the component body stays the same, just add the metadata export above it.)

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/newsletter/unsubscribed/page.tsx
git commit -m "feat: add metadata to newsletter unsubscribed page"
```

---

### Task 9: Fix Empty Alt Text on Tool Avatars

**Files:**

- Modify: `src/components/common/tool-avatar.tsx:52-59`

**Interfaces:**

- Consumes: `name` prop (already passed to component)
- Produces: meaningful alt text on images

- [ ] **Step 1: Update img alt attribute**

In `src/components/common/tool-avatar.tsx`, find the `<img>` element (around line 52-59) and change `alt=""` to `alt={name}`:

```typescript
<img
  src={logo ?? faviconUrl(website)}
  alt={name}
  className="absolute inset-0 h-full w-full object-cover"
  onError={(e) => {
    (e.target as HTMLImageElement).style.display = "none";
  }}
  loading="lazy"
/>
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/common/tool-avatar.tsx
git commit -m "fix: add meaningful alt text to tool avatar images"
```

---

### Task 10: Create llms.txt for AI Search Engines

**Files:**

- Create: `public/llms.txt`

**Interfaces:**

- Consumes: nothing (static file)
- Produces: `/llms.txt` route served from public directory

- [ ] **Step 1: Create public/llms.txt**

```markdown
# Radarly

> Radarly is an AI-powered tool discovery platform that scans Product Hunt, GitHub, Hacker News, and Reddit daily to rank emerging AI tools by real momentum.

## What We Do

Radarly tracks AI tools across four source platforms every 24 hours. Each tool receives a momentum score (0-100) based on discussion volume, velocity of mentions, community engagement, and retention signals. Tools are ranked and categorized so builders can discover what's actually taking off — not just what launched yesterday.

## Key Pages

- [Home](https://radarly.app) — Trending AI tools ranked by momentum
- [About](https://radarly.app/about) — How Radarly works, methodology, FAQ
- [Categories](https://radarly.app/categories/code-development) — Browse tools by category
- [Submit a Tool](https://radarly.app/submit) — Nominate an AI product for review
- [Contact](https://radarly.app/contact) — Get in touch

## Categories

- Code & Development — Editors, agents, and infrastructure changing how software gets shipped
- Writing & Content — Research and creation tools that help ideas travel further
- Design & Creative — Visual systems and generative tools for faster creative direction
- Productivity — Focused assistants that remove friction from everyday knowledge work
- Data & Analytics — Models and analysis layers that turn raw information into decisions
- Marketing & SEO — Discovery, research, and campaign tools finding measurable demand
- Image Generation — Image models and visual workflows moving from prompt to production
- Video & Audio — Voice, music, and motion tools reshaping media production

## Data Sources

- Product Hunt — Product launches and upvotes
- GitHub — Repository activity and stars
- Hacker News — Discussion and engagement
- Reddit — Community conversation and mentions

## Contact

For questions, partnerships, or bug reports: https://radarly.app/contact
```

- [ ] **Step 2: Verify file is served**

Run: `curl -s http://localhost:3000/llms.txt | head -5`
Expected: First 5 lines of the file (requires dev server running)

- [ ] **Step 3: Commit**

```bash
git add public/llms.txt
git commit -m "feat: add llms.txt for AI search engine context"
```

---

### Task 11: Add generateStaticParams to Dynamic Routes

**Files:**

- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/app/categories/[slug]/page.tsx`

**Interfaces:**

- Consumes: `getAllTools()` from `@/lib/data`, `getCategoryProfiles()` from `@/lib/data`
- Produces: `generateStaticParams` exports for static generation at build time

- [ ] **Step 1: Add generateStaticParams to tools/[slug]/page.tsx**

Add this export before the `generateMetadata` function:

```typescript
export async function generateStaticParams() {
  const tools = await getAllTools();
  return tools.map(tool => ({
    slug: tool.slug,
  }));
}
```

- [ ] **Step 2: Add generateStaticParams to categories/[slug]/page.tsx**

Add this export before the `generateMetadata` function:

```typescript
export async function generateStaticParams() {
  const profiles = await getCategoryProfiles();
  return profiles.map(profile => ({
    slug: profile.id,
  }));
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/tools/[slug]/page.tsx src/app/categories/[slug]/page.tsx
git commit -m "feat: add generateStaticParams for static generation of dynamic routes"
```

---

## Post-Implementation Verification

After all tasks are complete, verify the SEO infrastructure works:

1. **Build check**: `pnpm build` — ensure no build errors
2. **robots.txt**: Visit `/robots.txt` — should show allow rules and sitemap URL
3. **sitemap.xml**: Visit `/sitemap.xml` — should list all tool and category pages
4. **404 page**: Visit `/nonexistent-page` — should show custom 404
5. **llms.txt**: Visit `/llms.txt` — should show AI context file
6. **JSON-LD**: View page source on a tool page — should contain `<script type="application/ld+json">`
7. **Canonical tags**: View page source — should contain `<link rel="canonical">`
8. **Rich Results Test**: Run a tool page URL through https://search.google.com/test/rich-results

---

## Summary

| Task                   | Files Changed | Impact                       |
| ---------------------- | ------------- | ---------------------------- |
| 1. robots.txt          | 1 new         | Critical — controls crawling |
| 2. sitemap.xml         | 1 new         | Critical — page discovery    |
| 3. Root metadata       | 1 modified    | High — OG/Twitter cards      |
| 4. Tool page SEO       | 1 modified    | High — canonical + JSON-LD   |
| 5. Category page SEO   | 1 modified    | High — canonical + JSON-LD   |
| 6. About FAQ schema    | 1 modified    | Medium — rich results        |
| 7. Custom 404          | 1 new         | Medium — UX + crawl          |
| 8. Newsletter metadata | 1 modified    | Low — completeness           |
| 9. Alt text fix        | 1 modified    | Medium — accessibility + SEO |
| 10. llms.txt           | 1 new         | High — AI search visibility  |
| 11. Static params      | 2 modified    | High — build-time generation |
