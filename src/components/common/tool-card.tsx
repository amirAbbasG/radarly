"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Flame, Minus, TrendingUp } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Sparkline } from "@/components/common/sparkline";
import { toolSlug, type Signal, type Tool } from "@/lib/tools-data";
import { ToolAvatar } from "@/components/common/tool-avatar";

const signalMap: Record<
  Signal,
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: {
    label: "Hot",
    icon: Flame,
    className: "text-accent bg-accent/10 border-accent/20",
  },
  rising: {
    label: "Rising",
    icon: TrendingUp,
    className: "text-secondary bg-secondary/10 border-secondary/20",
  },
  steady: {
    label: "Steady",
    icon: Minus,
    className: "text-muted-foreground bg-muted border-border",
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
};

export function ToolCard({
  tool,
  rank,
  highlight = false,
}: {
  tool: Tool;
  rank: number;
  highlight?: boolean;
}) {
  const sig = signalMap[tool.sig];
  const SigIcon = sig.icon;

  return (
    <motion.article
      layout
      variants={cardVariant}
      whileHover={{ y: -4 }}
      animate={
        highlight
          ? {
              boxShadow:
                "0 0 0 2px var(--color-secondary), 0 12px 40px -12px var(--color-secondary)",
            }
          : { boxShadow: "0 0 0 0px transparent, 0 0px 0px 0px transparent" }
      }
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl   flex"
    >
      <MagicCard
        gradientColor="color-mix(in oklch, var(--color-primary) 15%, transparent)"
        gradientFrom="var(--color-primary)"
        gradientTo="var(--color-secondary)"
        className=" w-full"
      >
        <Link
          href={`/tools/${toolSlug(tool.name)}`}
          aria-label={`View details for ${tool.name}`}
          className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
        />
        <div className="h-full w-full  p-5 overflow-hidden flex flex-col ">
          {/* rank + score */}
          <div className="mb-4 flex  items-start  gap-2   ">
            <div className="flex gap-3 ">
              <ToolAvatar
                name={tool.name}
                logo={tool.logo}
                website={tool.website}
                size="md"
              />
              <div className="min-w-0 ">
                <h3 className="break-all line-clamp-1  font-heading text-base font-semibold leading-tight text-foreground ">
                  {tool.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  #{rank} · {tool.source}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-xl font-bold text-foreground tabular-nums">
                {tool.score}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                momentum
              </div>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-muted-foreground   ">
            {tool.hook}
          </p>

          {/* sparkline */}
          <div className="mb-4 mt-auto h-10 w-full text-secondary">
            <Sparkline
              points={tool.spark}
              className="h-10 w-full"
              width={220}
              height={40}
            />
          </div>

          <div className="flex items-center justify-between">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium " +
                sig.className
              }
            >
              <SigIcon className="h-3 w-3" />
              {sig.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-secondary">
              View details
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </div>
      </MagicCard>
    </motion.article>
  );
}
