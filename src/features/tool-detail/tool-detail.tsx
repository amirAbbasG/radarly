"use client";

import { useRef, useState, useCallback } from "react";
import { useShare } from "@/hooks/use-share";
import Link from "next/link";
import { motion, useScroll, useSpring } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Globe,
  Minus,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Sparkline } from "@/components/common/sparkline";
import { MomentumChart } from "@/features/tool-detail/momentum-chart";
import { ReviewSection } from "./review-section";
import {
  CATEGORY_LABELS,
  type Tool,
  type ToolDetail as ToolDetailData,
  type ReviewData,
} from "@/lib/tools-data";
import { ToolAvatar } from "@/components/common/tool-avatar";
import { RelatedCard } from "@/features/tool-detail/related-card";
import { SIGNAL_CONFIG } from "@/lib/signal";
import { toggleSave, castVote } from "@/app/actions/tool-interactions";

const ease = [0.23, 1, 0.32, 1] as const;

function Section({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "momentum", label: "Momentum" },
  { id: "score", label: "Score" },
  { id: "community", label: "Community" },
  { id: "related", label: "Related" },
];

export function ToolDetail({
  tool,
  detail,
  related,
  rank,
  interactionState,
  reviews,
  isAuthenticated,
}: {
  tool: Tool;
  detail: ToolDetailData;
  related: Tool[];
  rank: number;
  interactionState: { saved: boolean; voted: boolean; voteCount: number };
  reviews: ReviewData[];
  isAuthenticated: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  const [saved, setSaved] = useState(interactionState.saved);
  const [voted, setVoted] = useState(interactionState.voted);
  const [voteCount, setVoteCount] = useState(interactionState.voteCount);

  const saveVersionRef = useRef(0);
  const voteVersionRef = useRef(0);

  const handleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    const version = ++saveVersionRef.current;
    try {
      const result = await toggleSave(tool.slug);
      if (version === saveVersionRef.current) setSaved(result.saved);
    } catch {
      if (version === saveVersionRef.current) setSaved(!next);
    }
  }, [saved, tool.slug]);

  const handleVote = useCallback(async () => {
    const nextVoted = !voted;
    const nextCount = nextVoted ? voteCount + 1 : voteCount - 1;
    setVoted(nextVoted);
    setVoteCount(nextCount);
    const version = ++voteVersionRef.current;
    try {
      const result = await castVote(tool.slug);
      if (version === voteVersionRef.current) {
        setVoted(result.voted);
        setVoteCount(result.count);
      }
    } catch {
      if (version === voteVersionRef.current) {
        setVoted(!nextVoted);
        setVoteCount(voteCount);
      }
    }
  }, [voted, voteCount, tool.slug]);

  const sig = SIGNAL_CONFIG[tool.sig];
  const SigIcon = sig.icon;
  const category = CATEGORY_LABELS[tool.cat] ?? tool.cat;

  const { copied, share: handleShare } = useShare();

  return (
    <div ref={containerRef} className="relative">
      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[55] h-0.5 origin-left bg-secondary"
        aria-hidden="true"
      />

      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-6rem] h-72 w-[42rem] -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-10">
        {/* breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5 opacity-60" />
          <Link
            href="/#trending"
            className="transition-colors hover:text-foreground"
          >
            {category}
          </Link>
          <ChevronRight className="size-3.5 opacity-60" />
          <span className="text-foreground">{tool.name}</span>
        </motion.nav>

        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to radar
        </Link>
      </div>

      {/* hero */}
      <div className="mx-auto mt-6 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:gap-10 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="flex flex-wrap items-start gap-5">
            <ToolAvatar
              name={tool.name}
              logo={tool.logo}
              website={tool.website}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium " +
                    sig.className
                  }
                >
                  <SigIcon className="size-3" />
                  {sig.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  #{rank} on radar
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {category}
                </span>
              </div>
              <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                {tool.name}
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
                {detail.tagline}
              </p>
            </div>
          </div>

          {/* actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={detail.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform hover:brightness-110 active:scale-95"
            >
              <Globe className="size-4" />
              Visit site
              <ArrowUpRight className="size-4" />
            </a>
            <button
              type="button"
              onClick={handleSave}
              aria-pressed={saved}
              className={
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors " +
                (saved
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border text-foreground hover:border-secondary/50")
              }
            >
              <Bookmark className={"size-4 " + (saved ? "fill-current" : "")} />
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => handleShare({ title: `${tool.name} · Radarly` })}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-secondary/50"
            >
              {copied ? (
                <Check className="size-4 text-secondary" />
              ) : (
                <Share2 className="size-4" />
              )}
              {copied ? "Copied" : "Share"}
            </button>
          </div>

          {/* metrics strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {detail.metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.06 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
                  {m.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {m.label}
                </div>
                <div
                  className={
                    "mt-2 inline-flex items-center gap-1 text-[11px] font-medium " +
                    (m.trend === "up"
                      ? "text-secondary"
                      : "text-muted-foreground")
                  }
                >
                  {m.trend === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <Minus className="size-3" />
                  )}
                  {m.delta}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* sticky evaluation panel */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Radar score
              </span>
              <Sparkles className="size-4 text-secondary" />
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-heading text-5xl font-bold tabular-nums text-foreground">
                {tool.score}
              </span>
              <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-3 h-10 text-secondary">
              <Sparkline
                points={tool.spark}
                className="h-10 w-full"
                width={260}
                height={40}
              />
            </div>

            <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Pricing</dt>
                <dd className="font-medium text-foreground">
                  {detail.pricing}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="text-right font-medium text-foreground">
                  {detail.priceNote}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium text-foreground">{tool.source}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Last scan</dt>
                <dd className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-secondary" />
                  </span>
                  {detail.lastScan}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-5">
              <span className="text-xs text-muted-foreground">
                Available on
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.platforms.map(p => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* in-page nav */}
      <div className="sticky top-16 z-40 mt-12 border-y border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-10">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_320px] lg:gap-10 lg:px-10">
        <div className="flex flex-col gap-14">
          {/* overview */}
          <Section>
            <div id="overview" className="scroll-mt-32">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Overview
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
                {detail.about}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {detail.highlights.map(h => (
                  <div
                    key={h.title}
                    className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-secondary/40"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <Sparkles className="size-4" />
                    </div>
                    <h3 className="mt-3 font-heading text-sm font-semibold text-foreground">
                      {h.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {h.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-border bg-surface/40 p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Best for
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {detail.bestFor.map(b => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-4 shrink-0 text-secondary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* momentum */}
          <Section>
            <div id="momentum" className="scroll-mt-32">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  Momentum
                </h2>
                <span className="text-xs text-muted-foreground">
                  Signal across tracked sources
                </span>
              </div>
              <div className="mt-4">
                <MomentumChart points={tool.spark} />
              </div>
            </div>
          </Section>

          {/* score breakdown */}
          <Section>
            <div id="score" className="scroll-mt-32">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Score breakdown
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                How Radarly weighs the signal behind the {tool.score} momentum
                score.
              </p>
              <div className="mt-6 flex flex-col gap-5">
                {detail.scoreBreakdown.map((s, i) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {s.value}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.value}%` }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.9, ease, delay: i * 0.1 }}
                        className="h-full rounded-full bg-secondary"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {s.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* community */}
          <Section>
            <div id="community" className="scroll-mt-32">
              <ReviewSection
                toolSlug={tool.slug}
                initialReviews={reviews}
                isAuthenticated={isAuthenticated}
                voted={voted}
                voteCount={voteCount}
                onToolVote={handleVote}
              />
            </div>
          </Section>

          {/* related */}
          <Section>
            <div id="related" className="scroll-mt-32">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Related tools
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                More {category.toLowerCase()} tools climbing the radar.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No related tools yet.
                  </p>
                )}
                {related.map(r => (
                  <RelatedCard key={r.name} tool={r} />
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* right rail: quick facts (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">
                Quick facts
              </h3>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium text-foreground">{category}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Signal</dt>
                  <dd className="font-medium text-foreground">{sig.label}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Rank</dt>
                  <dd className="font-medium text-foreground">#{rank}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Pricing</dt>
                  <dd className="font-medium text-foreground">
                    {detail.pricing}
                  </dd>
                </div>
              </dl>
              <a
                href={detail.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform hover:brightness-110 active:scale-95"
              >
                Visit {tool.name}
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <h3 className="text-sm font-semibold text-foreground">
                Submit a tool
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Spotted something climbing faster? Put it on our radar.
              </p>
              <Link
                href="/#newsletter"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:brightness-110"
              >
                Submit a tool
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
