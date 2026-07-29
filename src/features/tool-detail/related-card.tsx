"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Flame, Minus, TrendingUp } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
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

export function RelatedCard({ tool }: { tool: Tool }) {
  const sig = signalMap[tool.sig];
  const SigIcon = sig.icon;

  return (
    <motion.article
      layout
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-xl flex"
    >
      <MagicCard
        gradientColor="color-mix(in oklch, var(--color-primary) 12%, transparent)"
        gradientFrom="var(--color-primary)"
        gradientTo="var(--color-secondary)"
        className="p-4 "
      >
        <Link
          href={`/tools/${toolSlug(tool.name)}`}
          aria-label={`View details for ${tool.name}`}
          className="absolute inset-0 z-10 rounded-xl focus:outline-none"
        />
        <div className="h-full w-full flex flex-col">
          <div className="flex items-center justify-between">
            <ToolAvatar
              name={tool.name}
              logo={tool.logo}
              website={tool.website}
              size="sm"
            />
            <span className="font-heading text-lg font-bold tabular-nums text-foreground z-20">
              {tool.score}
            </span>
          </div>
          <h3 className="mt-3 font-heading text-sm font-semibold text-foreground">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground flex-1 ">
            {tool.hook}
          </p>
          <div className="mt-4 flex items-center  justify-between">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                sig.className
              }
            >
              <SigIcon className="size-3" />
              {sig.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-secondary">
              View
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </div>
      </MagicCard>
    </motion.article>
  );
}
