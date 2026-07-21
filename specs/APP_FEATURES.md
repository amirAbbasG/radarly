# AI Tool Radar — App spec

A living catalog of trending AI tools and apps, kept fresh by an automated agent pipeline and read by builders who want to know what's worth trying this week.

## 1. Core pages

### Home / trending feed

**Hero (top of page, above the feed)**

- Headline that states the value prop in one line (e.g. "What builders are actually shipping with, right now")
- Live-feeling animated signal visual as the centerpiece — options:
  - **Radar sweep:** a slow rotating sweep line over a dotted radar field, with a few "blips" (dots) that pulse when the sweep passes over them — ties directly into the trending/signal metaphor
  - **Pulse ticker:** a horizontal row of small tool logos/avatars that gently float in from the right, like a live feed scrolling past, with the newest one pulsing on entry
  - **Rising counter:** a big animated number ("247 tools tracked this week") that counts up on page load, paired with a subtle background pulse
- Keep it to ONE signature animation, not several competing effects — the radar sweep is the strongest fit for the brand
- Motion should be ambient and looping (2-4s cycle), not attention-grabbing — respect `prefers-reduced-motion` and freeze to a static state for users who have it on
- Below the animation: a single primary CTA is optional (e.g. "Browse trending tools ↓") that scrolls to the feed, or the hero can just flow directly into the grid with no button at all

**This are just suggestions, check them but still user skills and mcps to create tend and creative hero with animation**

**Feed (below hero)**

- Grid of tool cards (logo, name, one-line hook, category tag, momentum score, signal state)
- Sort: trending now, this week, all-time
- Filter by category (coding, design, productivity, content, audio/video, data, other)
- Search bar (name or description match)

### Tool detail page

- Full description (agent-generated summary, 2-4 sentences)
- Screenshot or logo
- Category + tags
- Momentum chart (mentions/upvotes over last 7-14 days)
- Source links (Product Hunt, GitHub, HN thread, etc.)
- "Similar tools" section (same category, ranked by score)
- Outbound link to the tool itself

### Category pages

- Same card grid, pre-filtered by category
- Useful for SEO — each category page can rank for "best AI tools for X"

### Weekly digest / archive

- Auto-generated "This week in AI tools" summary page
- Also doubles as newsletter content if you add email later

### About / how it works

- One paragraph explaining the site is AI-curated, where data comes from, how scoring works
- Builds trust — people are wary of fully-automated content, so transparency helps

## 2. Core data model

Each tool record needs:

- `name`, `slug`, `logo_url`, `screenshot_url`
- `description` (agent-written, 2-4 sentences)
- `category`, `tags[]`
- `source_url`, `source_platform` (Product Hunt / GitHub / HN / Reddit)
- `trending_score` (numeric, computed)
- `momentum_history` (array of {date, score} for the chart)
- `first_seen_at`, `last_updated_at`
- `status` (pending_review / published / archived) — useful while you're still trusting the agent

## 3. Design system components needed

_(maps to the AI Tool Radar visual system already defined)_

- Hero signal animation (radar sweep or pulse ticker — one signature loop, reduced-motion fallback)
- Tool card (logo, name, hook, tags, score, pulse indicator)
- Category badge / pill
- Momentum sparkline (small inline chart)
- Signal state indicator (rising / steady / flat)
- Filter bar / search input
- Detail page layout (hero + chart + related tools)
- Empty state (e.g. "No tools yet in this category — check back soon")

## 4. Nice-to-haves (post-MVP)

- Email digest (weekly "what's trending" summary)
- User accounts + saved/bookmarked tools
- Voting or reactions on tool cards
- RSS feed
- Public API for the data (developers love this, drives backlinks)
- Comparison view (pick 2-3 tools, side-by-side)
- "Submit a tool" form for community suggestions

## 6. MVP scope (build this first)

1. Home feed with tool cards (one category, one data source)
2. Tool detail page
3. Agent pipeline: fetch → summarize → store (manual review before publish)
4. Basic search/filter

Everything in section 5 comes after this works end-to-end.
