### Task 11: Update home page + feature components

**Files:**
- Modify: src/app/page.tsx
- Modify: src/features/home/hero.tsx
- Modify: src/features/home/trending-feed.tsx
- Modify: src/features/home/tool-of-week.tsx
- Modify: src/features/home/categories.tsx

**Key changes:** Page becomes async, fetches data, passes as props. Components accept props instead of reading globals.

- [ ] **Step 1: Update src/app/page.tsx**

Make the page async and fetch data. Pass as props to child components.

```tsx
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/features/home/hero";
import { TrustStrip } from "@/features/home/trust-strip";
import { ToolOfWeek } from "@/features/home/tool-of-week";
import { TrendingFeed } from "@/features/home/trending-feed";
import { HowItWorks } from "@/features/home/how-it-works";
import { Categories } from "@/features/home/categories";
import { Newsletter } from "@/features/home/newsletter";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { getAllTools, getToolOfWeek, getCategoryProfiles } from "@/lib/data";
import { CATEGORIES } from "@/lib/tools-data";

export default async function Page() {
  const [allTools, toolOfWeek, categoryProfiles] = await Promise.all([
    getAllTools(),
    getToolOfWeek(),
    getCategoryProfiles(),
  ]);

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero toolCount={allTools.length} />
        <TrustStrip />
        <ToolOfWeek tool={toolOfWeek} />
        <TrendingFeed tools={allTools} categories={CATEGORIES} />
        <HowItWorks />
        <Categories categoryProfiles={categoryProfiles} />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Update src/features/home/hero.tsx**

Accept toolCount prop. Replace hardcoded "1680" with the prop.

Change the component signature from:
```tsx
export function Hero() {
```
to:
```tsx
export function Hero({ toolCount = 0 }: { toolCount?: number }) {
```

And change the stat array from:
```tsx
{ n: 1680, s: "+", l: "Tools tracked" },
```
to:
```tsx
{ n: toolCount, s: "", l: "Tools tracked" },
```

No other changes to hero.tsx. Rest of the component stays identical.

- [ ] **Step 3: Update src/features/home/trending-feed.tsx**

Accept tools and categories as props instead of importing TOOLS/CATEGORIES from tools-data.ts.

**Import changes:**
- Remove: `import { CATEGORIES, TOOLS } from "@/lib/tools-data";`
- Add: `import type { Tool, Category } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function TrendingFeed() {
```
to:
```tsx
export function TrendingFeed({ tools, categories }: { tools: Tool[]; categories: Category[] }) {
```

**Body changes:**
- Replace `TOOLS` references with `tools`
- Replace `CATEGORIES` references with `categories`

Specifically:
- Line 23: `let list = tools.filter(...)` (was `TOOLS.filter(...)`)
- Line 71: `{categories.map(...)}` (was `{CATEGORIES.map(...)}`)

No other changes needed.

- [ ] **Step 4: Update src/features/home/tool-of-week.tsx**

Accept tool prop instead of importing TOOL_OF_WEEK.

**Import changes:**
- Remove: `import { TOOL_OF_WEEK } from "@/lib/tools-data";`
- Add: `import type { Tool } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function ToolOfWeek() {
  const t = TOOL_OF_WEEK;
```
to:
```tsx
export function ToolOfWeek({ tool }: { tool: Tool | null }) {
  if (!tool) return null;
  const t = tool;
```

**Stats section:** Replace `t.stats` (which only exists on TOOL_OF_WEEK mock object) with derived stats from the Tool type:

```tsx
const stats = [
  { label: "Momentum", value: String(t.score) },
  { label: "Signal", value: t.sig.charAt(0).toUpperCase() + t.sig.slice(1) },
  { label: "Source", value: t.source },
];
```

Use `{stats.map(...)}` instead of `{t.stats.map(...)}` in the JSX.

- [ ] **Step 5: Update src/features/home/categories.tsx**

Accept categoryProfiles prop instead of hardcoded CATS array.

**Import changes:**
- Add: `import type { CategoryProfile } from "@/lib/tools-data";`

**Component signature change from:**
```tsx
export function Categories() {
```
to:
```tsx
export function Categories({ categoryProfiles }: { categoryProfiles: CategoryProfile[] }) {
```

**Remove the hardcoded CATS constant** (lines 22-79 in current file). Replace with icon and color maps:

```tsx
import {
  Code2, PenLine, Palette, Zap, BarChart3, Megaphone, ImageIcon, Video,
} from "lucide-react";

const ICON_MAP: Record<string, typeof Code2> = {
  "code-development": Code2,
  "writing-content": PenLine,
  "design-creative": Palette,
  productivity: Zap,
  "data-analytics": BarChart3,
  "marketing-seo": Megaphone,
  "image-generation": ImageIcon,
  "video-audio": Video,
};

const COLOR_MAP: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  secondary: "text-secondary bg-secondary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};
```

Add mapping inside the component:
```tsx
const cats = categoryProfiles.map((c) => ({
  name: c.label,
  slug: c.id,
  count: c.count,
  icon: ICON_MAP[c.id] ?? Zap,
  color: COLOR_MAP[c.accent] ?? "text-secondary bg-secondary/10",
}));
```

Replace `{CATS.map(...)}` with `{cats.map(...)}` in the JSX.

- [ ] **Step 6: Verify TypeScript**
```bash
npx tsc --noEmit
```
Expected: clean, no errors. Fix any type mismatches.

- [ ] **Step 7: Commit**
```bash
git add src/app/page.tsx src/features/home/
git commit -m "feat: wire home page and components to DB data"
```

---
