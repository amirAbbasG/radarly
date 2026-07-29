export type Signal = "rising" | "steady" | "hot";

export type Tool = {
  name: string;
  hook: string;
  logo?: string;
  cat: string;
  score: number;
  sig: Signal;
  /** momentum sparkline points, 0-100 */
  spark: number[];
  /** where it was surfaced from */
  source: string;
};

export type Category = {
  id: string;
  label: string;
};

export type CategoryProfile = Category & {
  description: string;
  radarRead: string;
  toolCategory: string;
  count: number;
  accent: "primary" | "secondary" | "accent" | "success" | "warning";
};

export const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    id: "code-development",
    label: "Code & Development",
    description:
      "Editors, agents, and infrastructure changing how software gets shipped.",
    radarRead:
      "Agentic builders are moving from autocomplete to owning complete implementation loops.",
    toolCategory: "coding",
    count: 342,
    accent: "primary",
  },
  {
    id: "writing-content",
    label: "Writing & Content",
    description: "Research and creation tools that help ideas travel further.",
    radarRead:
      "Research-grounded writing is outpacing generic generation as teams demand verifiable output.",
    toolCategory: "productivity",
    count: 287,
    accent: "secondary",
  },
  {
    id: "design-creative",
    label: "Design & Creative",
    description:
      "Visual systems and generative tools for faster creative direction.",
    radarRead:
      "The strongest products pair generation with editable, production-ready design systems.",
    toolCategory: "design",
    count: 198,
    accent: "accent",
  },
  {
    id: "productivity",
    label: "Productivity",
    description:
      "Focused assistants that remove friction from everyday knowledge work.",
    radarRead:
      "Context retention is becoming the deciding factor between useful assistants and forgotten tabs.",
    toolCategory: "productivity",
    count: 256,
    accent: "warning",
  },
  {
    id: "data-analytics",
    label: "Data & Analytics",
    description:
      "Models and analysis layers that turn raw information into decisions.",
    radarRead:
      "Open, enterprise-ready models are gaining as teams prioritize control and predictable costs.",
    toolCategory: "data",
    count: 174,
    accent: "success",
  },
  {
    id: "marketing-seo",
    label: "Marketing & SEO",
    description:
      "Discovery, research, and campaign tools finding measurable demand.",
    radarRead:
      "Answer-engine visibility is joining search rank as a core acquisition metric.",
    toolCategory: "productivity",
    count: 213,
    accent: "primary",
  },
  {
    id: "image-generation",
    label: "Image Generation",
    description:
      "Image models and visual workflows moving from prompt to production.",
    radarRead:
      "Text accuracy and controllable edits now matter more than novelty alone.",
    toolCategory: "design",
    count: 167,
    accent: "accent",
  },
  {
    id: "video-audio",
    label: "Video & Audio",
    description: "Voice, music, and motion tools reshaping media production.",
    radarRead:
      "Specialized creation workflows are winning over all-in-one suites on quality and control.",
    toolCategory: "audio-video",
    count: 143,
    accent: "secondary",
  },
];

export const CATEGORIES: Category[] = [
  { id: "all", label: "All" },
  { id: "coding", label: "Coding" },
  { id: "design", label: "Design" },
  { id: "productivity", label: "Productivity" },
  { id: "audio-video", label: "Audio & Video" },
  { id: "data", label: "Data" },
];

export function getCategoryProfile(slug: string) {
  return CATEGORY_PROFILES.find(category => category.id === slug);
}

export function toolSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id !== "all").map(c => [c.id, c.label]),
);

type Pricing = "Free" | "Freemium" | "Paid";

export type ToolDetail = {
  tagline: string;
  about: string;
  pricing: Pricing;
  priceNote: string;
  platforms: string[];
  website: string;
  lastScan: string;
  bestFor: string[];
  highlights: { title: string; body: string }[];
  scoreBreakdown: { label: string; value: number; note: string }[];
  reviews: { author: string; role: string; text: string; up: number }[];
  metrics: {
    label: string;
    value: string;
    delta: string;
    trend: "up" | "flat";
  }[];
};

/** Deterministic pseudo-random helper so demo metadata is stable per tool. */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const PLATFORMS = [
  "Web",
  "macOS",
  "Windows",
  "Linux",
  "iOS",
  "Android",
  "CLI",
  "API",
  "VS Code",
];
const PRICING: Pricing[] = ["Free", "Freemium", "Paid"];
const REVIEWERS = [
  { author: "Alex Rivera", role: "Senior Engineer" },
  { author: "Priya Nair", role: "Product Designer" },
  { author: "Jordan Kim", role: "Indie Hacker" },
  { author: "Sam Okafor", role: "Startup CTO" },
];

export function getToolDetail(tool: Tool): ToolDetail {
  const h = hash(tool.name);
  const cat = CATEGORY_LABELS[tool.cat] ?? tool.cat;
  const platforms = [
    PLATFORMS[h % 3],
    PLATFORMS[3 + (h % 3)],
    PLATFORMS[6 + (h % 3)],
  ];
  const uniquePlatforms = Array.from(new Set(platforms));
  const first = tool.spark[0];
  const last = tool.spark[tool.spark.length - 1];
  const growth = Math.round(((last - first) / Math.max(1, first)) * 100);

  return {
    tagline: tool.hook,
    about: `${tool.name} is a ${cat.toLowerCase()} tool that surfaced on ${tool.source} and has been climbing our radar. It stands out for how quickly it turns intent into output, with a workflow that feels native to how people already work. We track its momentum across the sources that matter so you can decide whether it deserves a spot in your stack.`,
    pricing: PRICING[h % 3],
    priceNote:
      PRICING[h % 3] === "Free"
        ? "Free to use"
        : PRICING[h % 3] === "Freemium"
          ? `Free tier · Pro from $${10 + (h % 20)}/mo`
          : `From $${15 + (h % 30)}/mo`,
    platforms: uniquePlatforms,
    website: `https://${toolSlug(tool.name)}.example.com`,
    lastScan: `${1 + (h % 9)}h ago`,
    bestFor: [
      `${cat} teams shipping fast`,
      h % 2 === 0
        ? "Solo builders and indie hackers"
        : "Small cross-functional squads",
      h % 3 === 0 ? "Prototyping new ideas" : "Scaling an existing workflow",
    ],
    highlights: [
      {
        title: "Fast to first result",
        body: "Minimal setup — you get useful output within minutes of signing up.",
      },
      {
        title: "Context-aware",
        body: "Understands your project and intent instead of treating every request in isolation.",
      },
      {
        title: "Fits your stack",
        body: `Works across ${uniquePlatforms.join(", ")} so it slots into existing tooling.`,
      },
    ],
    scoreBreakdown: [
      {
        label: "Momentum",
        value: tool.score,
        note: "Velocity of mentions and signups",
      },
      {
        label: "Community buzz",
        value: Math.max(40, tool.score - (h % 18)),
        note: "Discussion volume across sources",
      },
      {
        label: "Retention signal",
        value: Math.max(45, tool.score - (h % 12)),
        note: "Repeat usage and return rate",
      },
      {
        label: "Source confidence",
        value: Math.max(55, tool.score - (h % 9)),
        note: "How reliable our signal is",
      },
    ],
    reviews: [
      {
        ...REVIEWERS[h % REVIEWERS.length],
        text: `Switched to ${tool.name} recently and it stuck. The learning curve was short and it saved real time in week one.`,
        up: 40 + (h % 120),
      },
      {
        ...REVIEWERS[(h + 1) % REVIEWERS.length],
        text: `Solid for ${cat.toLowerCase()} work. Not perfect, but the momentum here is well earned — the team ships improvements fast.`,
        up: 18 + (h % 70),
      },
    ],
    metrics: [
      {
        label: "Momentum score",
        value: String(tool.score),
        delta: `+${5 + (h % 12)}%`,
        trend: "up",
      },
      {
        label: "30d growth",
        value: `${growth >= 0 ? "+" : ""}${growth}%`,
        delta: "vs. prev",
        trend: growth >= 0 ? "up" : "flat",
      },
      {
        label: "Sources tracking",
        value: String(3 + (h % 4)),
        delta: "live",
        trend: "up",
      },
      {
        label: "Community score",
        value: `${Math.max(40, tool.score - (h % 15))}`,
        delta: `+${1 + (h % 6)}%`,
        trend: "up",
      },
    ],
  };
}
