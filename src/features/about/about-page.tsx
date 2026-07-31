"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowRight,
  Gauge,
  GitBranch,
  Layers,
  MessagesSquare,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealStagger,
  itemVariants,
} from "@/components/common/reveal";
import Link from "next/link";

const STATS = [
  { value: "2,400+", label: "Tools tracked" },
  { value: "38", label: "Signal sources" },
  { value: "Every 6h", label: "Full radar sweep" },
  { value: "0", label: "Paid placements" },
];

const PRINCIPLES = [
  {
    icon: Activity,
    title: "Momentum over hype",
    body: "We rank by the rate of change in real usage and attention, not follower counts or launch-day noise.",
  },
  {
    icon: ShieldCheck,
    title: "No pay-to-rank",
    body: "Rankings can never be bought. Sponsorships are labeled and kept entirely separate from the radar.",
  },
  {
    icon: ScanLine,
    title: "Transparent scoring",
    body: "Every tool exposes the signals behind its score, so you can judge the momentum for yourself.",
  },
];

const STAGES = [
  {
    icon: Layers,
    step: "01",
    title: "Collect",
    body: "We ingest signals from launch platforms, developer forums, package registries, and release feeds.",
  },
  {
    icon: Gauge,
    step: "02",
    title: "Normalize",
    body: "Raw activity is de-duplicated, weighted, and adjusted for source reliability and recency.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Score",
    body: "A momentum model measures acceleration, not just volume, to surface what is genuinely rising.",
  },
  {
    icon: Radar,
    step: "04",
    title: "Rank",
    body: "Tools are ranked and refreshed every few hours, so the radar always reflects the current wave.",
  },
];

const SOURCES = [
  {
    title: "Launch platforms",
    detail: "Product launches, upvotes, and early adoption spikes.",
  },
  {
    title: "Developer communities",
    detail: "Discussions, questions, and sentiment across forums.",
  },
  {
    title: "Package registries",
    detail: "Install trends and dependency growth over time.",
  },
  {
    title: "Release feeds",
    detail: "Shipping cadence, changelogs, and version velocity.",
  },
  {
    title: "Social signals",
    detail: "Attention velocity, filtered for noise and bots.",
  },
  {
    title: "Editorial review",
    detail: "Human checks to catch anomalies the model misses.",
  },
];

const FAQS = [
  {
    q: "How are tools ranked?",
    a: "Radarly scores each tool on momentum — the acceleration of real usage and attention across many independent sources. A steadily growing tool can outrank one with a huge but flat audience.",
  },
  {
    q: "Can companies pay to rank higher?",
    a: "No. Rankings are never for sale. Any sponsored content is clearly labeled and lives outside the radar, so it can never influence a tool’s position.",
  },
  {
    q: "How often does the radar update?",
    a: "A full sweep runs every six hours. Fast-moving tools can shift position within a single day as new signals arrive.",
  },
  {
    q: "Where does the AI come in?",
    a: "AI handles classification, de-duplication, and summarization at scale. Scoring rules stay transparent and auditable, and humans review edge cases before anything ships.",
  },
  {
    q: "How do I get a tool added?",
    a: "Submit it through the “Submit a Tool” link. If it clears our basic quality checks, it enters the radar automatically and starts accumulating signals.",
  },
];

export function AboutPage() {
  const reduce = useReducedMotion();

  return (
    <main className="relative">
      <AboutHero reduce={!!reduce} />

      {/* Stats strip */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RevealStagger className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
            {STATS.map(s => (
              <motion.div
                key={s.label}
                variants={itemVariants}
                className="flex flex-col gap-1 px-4 py-8 text-center"
              >
                <span className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                  {s.value}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
              </motion.div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              Our mission
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
              The signal, not the noise.
            </h2>
            <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
              New AI tools launch faster than anyone can track. Radarly cuts
              through the flood with one clear promise: show what is actually
              gaining momentum, ranked by real usage instead of marketing
              budgets. No sponsored slots, no vanity metrics — just an honest
              read on where builders are heading next.
            </p>
            <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
              We started Radarly because we were tired of endless top-10 lists
              that never changed. The tools that matter shift week to week, and
              our radar is built to catch that movement the moment it starts.
            </p>
          </Reveal>

          <RevealStagger className="grid gap-4">
            {PRINCIPLES.map(p => (
              <motion.div
                key={p.title}
                variants={itemVariants}
                className="group flex gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-colors hover:border-secondary/60"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <p.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Methodology */}
      <section
        id="methodology"
        className="scroll-mt-20 border-t border-border bg-surface/30"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <Badge variant="secondary" className="w-fit">
              How the radar works
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
              From raw signal to ranked tool
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Four stages run continuously in the background so the radar stays
              fresh without you lifting a finger.
            </p>
          </Reveal>

          <RevealStagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map(s => (
              <motion.div
                key={s.step}
                variants={itemVariants}
                className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/5"
              >
                <span className="font-heading text-xs font-bold tracking-widest text-secondary">
                  {s.step}
                </span>
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Sources */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <Reveal className="flex flex-col gap-5 lg:sticky lg:top-28">
            <Badge variant="secondary" className="w-fit">
              What we watch
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
              Signals from everywhere builders gather
            </h2>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              No single source tells the whole story. Radarly blends dozens of
              independent streams so no one platform can distort the picture.
            </p>
          </Reveal>

          <RevealStagger className="grid gap-3 sm:grid-cols-2">
            {SOURCES.map(s => (
              <motion.div
                key={s.title}
                variants={itemVariants}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-secondary"
                    aria-hidden="true"
                  />
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {s.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.detail}
                </p>
              </motion.div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* AI transparency callout */}
      <section
        id="transparency"
        className="scroll-mt-20 border-y border-border bg-surface/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <Reveal className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-card p-8 ring-1 ring-foreground/5 md:flex-row md:items-center md:p-10">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                AI does the heavy lifting. Humans keep it honest.
              </h2>
              <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">
                Models classify, de-duplicate, and summarize at a scale no team
                could match by hand. But the scoring rules stay transparent and
                auditable, and every anomaly gets a human review before it can
                move a ranking.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-10 lg:py-28"
      >
        <Reveal className="flex flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="w-fit">
            FAQ
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <Reveal className="mt-10" delay={0.05}>
          <Accordion
            defaultValue={["faq-0"]}
            className="rounded-xl border border-border bg-card px-5 ring-1 ring-foreground/5"
          >
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="font-heading text-base text-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-10">
        <Reveal className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center ring-1 ring-foreground/5 md:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, var(--secondary) 0, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6">
            <span className="flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Radar className="size-6" />
            </span>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
              See what&apos;s rising right now
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Jump into the live radar, or send us the tools and signals you
              think we should be watching next.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                render={<Link href="/#trending" />}
              >
                Explore the radar
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/#newsletter" />}
              >
                <MessagesSquare data-icon="inline-start" />
                Suggest a tool
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> Built for builders
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="size-3.5" /> Open methodology
              </span>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function AboutHero({ reduce }: { reduce: boolean }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-36 lg:pt-40">
      {/* radar backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 size-[640px] -translate-x-1/2 opacity-[0.12]"
      >
        <div className="absolute inset-0 rounded-full border border-secondary/40" />
        <div className="absolute inset-[12%] rounded-full border border-secondary/30" />
        <div className="absolute inset-[26%] rounded-full border border-secondary/20" />
        <div className="absolute inset-[40%] rounded-full border border-secondary/20" />
        {!reduce && (
          <motion.div
            className="absolute inset-0 origin-center"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--secondary) 40deg, transparent 60deg)",
              borderRadius: "9999px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-secondary" />
              </span>
              About Radarly
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              We track the momentum behind
              <span className="block text-gradient">every AI tool</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Radarly is an always-on radar for the AI tooling world — ranking
              what&apos;s genuinely rising by real usage, not marketing spend.
              Here&apos;s how it works and what we stand for.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
