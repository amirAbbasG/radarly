"use client";

import { Radar, Gauge, Sparkles } from "lucide-react";
import {
  Reveal,
  RevealStagger,
  itemVariants,
} from "@/components/common/reveal";
import { motion } from "motion/react";

const STEPS = [
  {
    num: "01",
    title: "Scan",
    icon: Radar,
    desc: "Our agent monitors Product Hunt, GitHub, Hacker News and Reddit every single day.",
  },
  {
    num: "02",
    title: "Score",
    icon: Gauge,
    desc: "Each tool is ranked by real momentum — upvotes, stars, mentions and velocity.",
  },
  {
    num: "03",
    title: "Surface",
    icon: Sparkles,
    desc: "Only what's genuinely rising makes the feed. No pay-to-play, no content farm.",
  },
];

// need client for motion variants on children
export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
      <Reveal className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          How Radarly works
        </h2>
        <p className="mt-3 text-muted-foreground">
          Three steps from noise to signal.
        </p>
      </Reveal>

      <RevealStagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.num}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-heading text-4xl font-bold text-border">
                  {s.num}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden h-px w-5 -translate-y-1/2 translate-x-full bg-border md:block" />
              )}
            </motion.div>
          );
        })}
      </RevealStagger>
    </section>
  );
}
