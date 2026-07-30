export type Signal = "rising" | "steady" | "hot";

export type Tool = {
  name: string;
  slug: string;
  hook: string;
  logo?: string;
  website?: string;
  cat: string;
  score: number;
  sig: Signal;
  /** momentum sparkline points, 0-100 */
  spark: number[];
  /** where it was surfaced from */
  source: string;
  description?: string;
  lastUpdatedAt?: string;
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

export type ReviewData = {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote: number;
  user: { name: string; id: string };
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function sparkStats(spark: number[]) {
  if (spark.length < 2) return { growth: 0, volatility: 0, trend: 0 };
  const first = spark[0];
  const last = spark[spark.length - 1];
  const growth = Math.round(((last - first) / Math.max(1, first)) * 100);

  let sumSq = 0;
  for (let i = 1; i < spark.length; i++) {
    sumSq += (spark[i] - spark[i - 1]) ** 2;
  }
  const volatility = Math.sqrt(sumSq / (spark.length - 1));

  const half = Math.floor(spark.length / 2);
  const recent = spark.slice(half);
  const older = spark.slice(0, half);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return { growth, volatility, trend };
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

// ponytail: hash stays for fields without real DB columns yet (pricing, platforms, bestFor, highlights, reviews)
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getToolDetail(tool: Tool): ToolDetail {
  const h = hash(tool.name);
  const cat = CATEGORY_LABELS[tool.cat] ?? tool.cat;
  const platforms = [
    PLATFORMS[h % 3],
    PLATFORMS[3 + (h % 3)],
    PLATFORMS[6 + (h % 3)],
  ];
  const uniquePlatforms = Array.from(new Set(platforms));
  const stats = sparkStats(tool.spark);

  const website = tool.website ?? `https://${toolSlug(tool.name)}.example.com`;
  const about =
    tool.description ??
    `${tool.name} is a ${cat.toLowerCase()} tool that surfaced on ${tool.source} and has been climbing our radar. It stands out for how quickly it turns intent into output, with a workflow that feels native to how people already work.`;
  const lastScan = tool.lastUpdatedAt
    ? timeAgo(tool.lastUpdatedAt)
    : `${1 + (h % 9)}h ago`;

  const momentum = tool.score;
  const community = Math.round(Math.max(40, tool.score - stats.volatility * 3));
  const retention =
    stats.trend > 10
      ? Math.min(100, Math.round(tool.score * 0.85 + stats.trend))
      : Math.max(40, Math.round(tool.score * 0.75));
  const sourceConf =
    tool.spark.length >= 8
      ? Math.min(100, Math.round(70 + tool.spark.length * 2))
      : Math.round(50 + tool.spark.length * 3);

  return {
    tagline: tool.hook,
    about,
    pricing: PRICING[h % 3],
    priceNote:
      PRICING[h % 3] === "Free"
        ? "Free to use"
        : PRICING[h % 3] === "Freemium"
          ? `Free tier · Pro from $${10 + (h % 20)}/mo`
          : `From $${15 + (h % 30)}/mo`,
    platforms: uniquePlatforms,
    website,
    lastScan,
    bestFor: [
      `${cat} teams shipping fast`,
      h % 2 === 0
        ? "Solo builders and indie hackers"
        : "Small cross-functional squads",
      h % 3 === 0 ? "Prototyping new ideas" : "Scaling an existing workflow",
    ],
    highlights: [
      {
        title: stats.trend > 15 ? "Accelerating fast" : "Steady growth",
        body:
          stats.trend > 15
            ? `Momentum up ${Math.round(stats.trend)}% in recent weeks — clear adoption ramp.`
            : `Consistent presence across tracked sources with ${Math.abs(Math.round(stats.trend))}% trend.`,
      },
      {
        title: "Category leader",
        body: `Ranked in the top tier of ${cat.toLowerCase()} tools by community signal and discussion volume.`,
      },
      {
        title:
          stats.volatility > 12 ? "High discussion volume" : "Stable signal",
        body:
          stats.volatility > 12
            ? `Generating significant conversation across sources — strong word-of-mouth indicator.`
            : `Proven reliability with steady engagement — low volatility suggests a mature product.`,
      },
    ],
    scoreBreakdown: [
      {
        label: "Momentum",
        value: momentum,
        note: "Velocity of mentions and signups",
      },
      {
        label: "Community buzz",
        value: community,
        note: "Discussion volume across sources",
      },
      {
        label: "Retention signal",
        value: retention,
        note: "Repeat usage and return rate",
      },
      {
        label: "Source confidence",
        value: sourceConf,
        note: stats.trend >= 0 ? "Signal strengthening" : "Signal weakening",
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
        value: `${stats.growth >= 0 ? "+" : ""}${stats.growth}%`,
        delta: "vs. prev",
        trend: stats.growth >= 0 ? "up" : "flat",
      },
      {
        label: "Sources tracking",
        value: String(Math.max(2, tool.spark.length)),
        delta: "live",
        trend: "up",
      },
      {
        label: "Community score",
        value: String(community),
        delta: stats.trend >= 0 ? `+${Math.round(stats.trend)}%` : "steady",
        trend: stats.trend >= 0 ? "up" : "flat",
      },
    ],
  };
}
