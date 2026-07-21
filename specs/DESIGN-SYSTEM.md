# Radarly Design System

Quick-reference for vibe coding new pages and components.

---

## Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Components:** shadcn/ui (built on `@base-ui/react` + `class-variance-authority`)
- **Theming:** `next-themes` (class-based dark mode, default: dark)
- **Icons:** `lucide-react`
- **Fonts:** Space Grotesk (headings) + DM Sans (body) via `next/font/google`

---

## Color Tokens

Use Tailwind classes referencing these tokens. Never hardcode hex/oklch values in components.

| Token | Tailwind class | Light | Dark | Usage |
|-------|---------------|-------|------|-------|
| `--primary` | `bg-primary` `text-primary` | `oklch(0.55 0.2 245)` | `oklch(0.65 0.2 245)` | CTAs, active states, key actions |
| `--primary-fg` | `text-primary-foreground` | white | near-black | Text on primary backgrounds |
| `--secondary` | `bg-secondary` `text-secondary` | `oklch(0.55 0.15 260)` | `oklch(0.6 0.15 260)` | Category badges, secondary actions |
| `--accent` | `bg-accent` `text-accent` | `oklch(0.72 0.17 65)` | `oklch(0.78 0.17 65)` | "New" badges, highlights, warm pop |
| `--accent-fg` | `text-accent-foreground` | near-black | near-black | Text on accent backgrounds |
| `--success` | `bg-success` `text-success` | `oklch(0.65 0.19 155)` | `oklch(0.72 0.19 155)` | Positive trends, scores >= 90 |
| `--warning` | `bg-warning` `text-warning` | `oklch(0.78 0.16 75)` | `oklch(0.82 0.18 75)` | Star icons, caution states |
| `--destructive` | `bg-destructive` `text-destructive` | `oklch(0.58 0.245 27)` | `oklch(0.65 0.22 25)` | Errors, delete actions |
| `--muted` | `bg-muted` | `oklch(0.96 0.006 240)` | `oklch(0.175 0.012 240)` | Subtle backgrounds, source badges |
| `--muted-fg` | `text-muted-foreground` | `oklch(0.48 0.02 240)` | `oklch(0.6 0.02 240)` | Secondary text, timestamps |
| `--card` | `bg-card` | white | `oklch(0.145 0.015 240)` | Card backgrounds |
| `--surface` | `bg-surface` | `oklch(0.975 0.004 240)` | `oklch(0.16 0.012 240)` | Subtle surface fills |
| `--surface-hover` | `bg-surface-hover` | `oklch(0.945 0.007 240)` | `oklch(0.2 0.015 240)` | Hover state for surfaces |
| `--border` | `border-border` | `oklch(0.92 0.008 240)` | `oklch(0.22 0.012 240)` | All borders |
| `--background` | `bg-background` | `oklch(0.985 0.003 240)` | `oklch(0.1 0.012 240)` | Page background |
| `--foreground` | `text-foreground` | `oklch(0.12 0.015 240)` | `oklch(0.95 0.005 240)` | Primary text |

### Color palette (single accent rule)

Primary = electric blue. Accent = amber/gold. That's it. No other saturated hues.
If you need a status color: `success` (green), `warning` (amber), `destructive` (red).

---

## Typography

| Role | Font | Weight | Class |
|------|------|--------|-------|
| Headings | Space Grotesk | 400-700 | `font-heading` |
| Body | DM Sans | 400, 500, 700 | `font-sans` (default) |
| Mono | Geist Mono | — | `font-mono` |

### Type scale

| Element | Class |
|---------|-------|
| Hero H1 | `text-5xl sm:text-6xl font-bold tracking-tight` |
| Section H2 | `text-2xl font-semibold` |
| Card title | `text-lg font-semibold` |
| Body | `text-base` or `text-lg` |
| Small / labels | `text-sm` |
| Micro / badges | `text-xs` or `text-[10px]` |

### Gradient text

```tsx
<span className="text-gradient">AI tooling</span>
```

Utility defined in `globals.css` — gradient from primary to secondary at 135deg.

---

## Spacing & Layout

- **Max width:** `max-w-6xl` (1152px) — all page content
- **Page padding:** `px-6` horizontal
- **Section gap:** `mb-16` between major sections
- **Card grid:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- **Border radius:** base `0.625rem` — use `rounded-xl` (cards), `rounded-lg` (buttons/badges), `rounded-full` (pills)
- **Nav height:** `h-16`

---

## Component Patterns

### Cards

```tsx
<div className="group relative rounded-xl border border-border bg-card p-5
  transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
  {/* optional gradient overlay on hover */}
  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10
    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div className="relative">...</div>
</div>
```

### Badges

```tsx
// Score badge (color by threshold)
<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border
  bg-success/15 text-success border-success/20">
  <Zap className="size-3" /> 94
</span>

// Trend badge
<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
  <TrendingUp className="size-3" /> +12%
</span>

// Category pill
<span className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
  Coding
</span>

// "New" pill
<span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
  New
</span>
```

### Filter pills (category selector)

```tsx
<button className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
  active
    ? "border-primary bg-primary/10 text-primary"
    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
}`}>
  <Icon className="size-4" /> Label
</button>
```

### Buttons

Use shadcn `Button` component. Variants: `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes: `default`, `sm`, `lg`, `icon`.

```tsx
import { Button } from "@/components/ui/button";

<Button>Primary</Button>
<Button variant="outline" size="lg">Outline</Button>
<Button variant="ghost" size="sm">Ghost</Button>
```

### Nav

```tsx
<nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
    ...
  </div>
</nav>
```

### Section header with eyebrow

```tsx
// Eyebrow (max 1 per 3 sections — use sparingly)
<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
  <Sparkles className="size-4" /> Label
</div>

// Section title + subtitle
<h2 className="font-heading text-2xl font-semibold text-foreground">Title</h2>
<p className="mt-1 text-sm text-muted-foreground">Subtitle</p>
```

---

## Utilities

Defined in `globals.css`:

| Class | What it does |
|-------|-------------|
| `text-gradient` | Gradient text (primary → secondary, 135deg) |
| `ring-primary-subtle` | Subtle 3px focus ring around primary color |

Do not add glow/shadow utilities. No neon outer glows.

---

## Dark Mode Rules

- Default theme is `dark` (set in `layout.tsx` via `ThemeProvider`)
- Always use Tailwind `dark:` variants or CSS tokens — never hardcode dark colors
- Page has ONE theme. No section-level theme flips.
- Test both modes before shipping.

---

## Icon Rules

- Library: `lucide-react` exclusively. Do not mix icon families.
- Size convention: `size-3` (badges), `size-4` (inline/nav), `size-6` (feature icons)
- strokeWidth: default (2) — do not override unless necessary
- Do not hand-roll SVG icons.

---

## Don'ts

- No purple/violet primary — we use electric blue (hue 245)
- No neon outer glow box-shadows
- No infinite CSS animations (float, pulse-glow) unless content demands it
- No `Inter` font — we use DM Sans for body, Space Grotesk for headings
- No hardcoded hex/oklch in components — always use tokens
- No generic "AI purple gradient" hero blobs
- No section-level theme switching
