"use client";

import { motion } from "motion/react";
import { ArrowRight, Radar, Sparkles } from "lucide-react";
import { RadarCanvas } from "@/features/home/radar-canvas";
import { NumberTicker } from "@/components/common/number-ticker";

const words = "Discover what's rising in AI — before everyone else".split(" ");

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      aria-label="Radarly hero"
    >
      {/* ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-20 top-24 h-80 w-80 rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-2 lg:px-10 lg:pt-16">
        {/* Left: copy */}
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            Live · updated daily
          </motion.div>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                variants={wordVariant}
                className="inline-block"
              >
                {w === "rising" || w === "AI" ? (
                  <span className="text-gradient">{w}</span>
                ) : (
                  w
                )}
                {i < words.length - 1 && "\u00A0"}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            An AI agent scans Product Hunt, GitHub, Hacker News and Reddit every
            day, scores real momentum, and surfaces the tools actually taking
            off. The signal — not the noise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <a
              href="#trending"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Explore the feed
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-secondary hover:text-secondary"
            >
              <Radar className="h-4 w-4" />
              How it works
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.6 }}
            className="mt-10 grid w-full max-w-md grid-cols-3 gap-4 border-t border-border pt-6"
          >
            {[
              { n: 1680, s: "+", l: "Tools tracked" },
              { n: 4, s: "", l: "Sources scanned" },
              { n: 24, s: "h", l: "Refresh cycle" },
            ].map(stat => (
              <div key={stat.l} className="flex flex-col">
                <dd className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  <NumberTicker value={stat.n} suffix={stat.s} />
                </dd>
                <dt className="mt-1 text-xs text-muted-foreground">{stat.l}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Right: live radar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="group relative z-0 mx-auto flex aspect-square w-full max-w-[280px] cursor-crosshair items-center justify-center sm:max-w-[420px] lg:max-w-[520px]"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-full border border-secondary/10"
            animate={{
              scale: [0.98, 1.015, 0.98],
              opacity: [0.35, 0.75, 0.35],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <RadarCanvas className="relative" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-transform duration-300 group-hover:-translate-y-1">
              <Sparkles className="size-3 text-accent" />
              move to inspect · click to pulse
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
