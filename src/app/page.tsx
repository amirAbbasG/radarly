import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { TrendingUp, Zap, Star, ExternalLink, ArrowRight, Sparkles, Code, Palette, Box, Brain, Search, BarChart3 } from "lucide-react";

const categories = [
  { name: "All", icon: Sparkles, active: true },
  { name: "Coding", icon: Code, active: false },
  { name: "Design", icon: Palette, active: false },
  { name: "Productivity", icon: Box, active: false },
  { name: "AI/ML", icon: Brain, active: false },
  { name: "Search", icon: Search, active: false },
  { name: "Analytics", icon: BarChart3, active: false },
];

const tools = [
  {
    name: "Cursor",
    tagline: "AI-first code editor",
    category: "Coding",
    score: 94,
    trend: "+12%",
    sources: ["Product Hunt", "GitHub"],
    isNew: false,
    gradient: "from-primary/15 to-secondary/10",
  },
  {
    name: "Midjourney v7",
    tagline: "Next-gen image generation",
    category: "Design",
    score: 91,
    trend: "+8%",
    sources: ["Reddit", "HN"],
    isNew: false,
    gradient: "from-secondary/15 to-primary/10",
  },
  {
    name: "Radarly",
    tagline: "AI tool discovery radar",
    category: "Productivity",
    score: 88,
    trend: "+24%",
    sources: ["Product Hunt"],
    isNew: true,
    gradient: "from-accent/15 to-primary/10",
  },
  {
    name: "Claude Code",
    tagline: "AI pair programmer",
    category: "Coding",
    score: 86,
    trend: "+15%",
    sources: ["GitHub", "HN"],
    isNew: false,
    gradient: "from-primary/10 to-secondary/15",
  },
  {
    name: "Perplexity Pro",
    tagline: "AI research engine",
    category: "Search",
    score: 84,
    trend: "+6%",
    sources: ["Reddit"],
    isNew: false,
    gradient: "from-secondary/10 to-accent/10",
  },
  {
    name: "Lovable",
    tagline: "Build apps with AI",
    category: "Coding",
    score: 82,
    trend: "+18%",
    sources: ["Product Hunt", "Reddit"],
    isNew: true,
    gradient: "from-accent/10 to-primary/10",
  },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-success/15 text-success border-success/20"
      : score >= 80
        ? "bg-primary/15 text-primary border-primary/20"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${color}`}>
      <Zap className="size-3" />
      {score}
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
      <TrendingUp className="size-3" />
      {trend}
    </span>
  );
}

type Tool = (typeof tools)[number];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold text-card-foreground">
                {tool.name}
              </h3>
              {tool.isNew && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{tool.tagline}</p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {tool.category}
          </span>
          {tool.sources.map((source) => (
            <span key={source} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {source}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ScoreBadge score={tool.score} />
          <TrendBadge trend={tool.trend} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Search className="size-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">Radarly</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Trending
            </Button>
            <Button variant="ghost" size="sm">
              Categories
            </Button>
            <ModeToggle />
            <Button size="sm">
              Subscribe
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero */}
        <section className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="size-4" />
            AI-powered tool discovery
          </div>
          <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            What&apos;s rising in{" "}
            <span className="text-gradient">AI tooling</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover trending AI tools and apps. Curated daily from Product Hunt,
            GitHub, Hacker News, and Reddit — so you don&apos;t have to dig through forums.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg">
              Explore Trends
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Categories
            </Button>
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    cat.active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tools Grid */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Trending Today
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Top AI tools by momentum score
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 text-warning" />
              <span>Updated 2h ago</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* Design System Showcase */}
        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-heading text-2xl font-semibold text-card-foreground mb-6">
            Design System Tokens
          </h2>

          {/* Color Palette */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Colors
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "Primary", class: "bg-primary" },
                { name: "Secondary", class: "bg-secondary" },
                { name: "Accent", class: "bg-accent" },
                { name: "Success", class: "bg-success" },
                { name: "Warning", class: "bg-warning" },
                { name: "Destructive", class: "bg-destructive" },
                { name: "Muted", class: "bg-muted" },
                { name: "Surface", class: "bg-surface" },
              ].map((color) => (
                <div key={color.name} className="flex flex-col items-center gap-1.5">
                  <div className={`size-10 rounded-lg ${color.class} ring-1 ring-white/10`} />
                  <span className="text-[10px] text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Typography
            </h3>
            <div className="space-y-2">
              <p className="font-heading text-4xl font-bold text-card-foreground">
                Heading — Space Grotesk
              </p>
              <p className="text-lg text-card-foreground">
                Body — DM Sans. Clean, modern, highly readable at all sizes.
              </p>
              <p className="text-sm text-muted-foreground">
                Muted — Used for secondary information, timestamps, and subtle labels.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Buttons
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Effects */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Effects
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary ring-primary-subtle">
                <Sparkles className="size-6 text-primary-foreground" />
              </div>
              <div className="flex size-16 items-center justify-center rounded-xl bg-accent">
                <Zap className="size-6 text-accent-foreground" />
              </div>
              <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                <Star className="size-6 text-secondary-foreground" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>Radarly — AI Tool Radar</span>
          <span>Built with Next.js + Tailwind</span>
        </div>
      </footer>
    </div>
  );
}
