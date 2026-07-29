"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Code2,
  PenLine,
  Palette,
  Zap,
  BarChart3,
  Megaphone,
  ImageIcon,
  Video,
} from "lucide-react";
import type { CategoryProfile } from "@/lib/tools-data";
import { MagicCard } from "@/components/ui/magic-card";
import {
  Reveal,
  RevealStagger,
  itemVariants,
} from "@/components/common/reveal";

const ICON_MAP: Record<string, typeof Code2> = {
  "code-development": Code2,
  "writing-content": PenLine,
  "design-creative": Palette,
  productivity: Zap,
  "data-analytics": BarChart3,
  "marketing-seo": Megaphone,
  "image-generation": ImageIcon,
  "video-audio": Video,
};

const COLOR_MAP: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  secondary: "text-secondary bg-secondary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

export function Categories({
  categoryProfiles,
}: {
  categoryProfiles: CategoryProfile[];
}) {
  const cats = categoryProfiles.map(c => ({
    name: c.label,
    slug: c.id,
    count: c.count,
    icon: ICON_MAP[c.id] ?? Zap,
    color: COLOR_MAP[c.accent] ?? "text-secondary bg-secondary/10",
  }));
  return (
    <section
      id="categories"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10"
    >
      <Reveal className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Explore by category
        </h2>
        <p className="mt-3 text-muted-foreground">
          Find the right AI tools for your workflow.
        </p>
      </Reveal>

      <RevealStagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cats.map(c => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.name}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="rounded-2xl"
            >
              <MagicCard
                gradientColor="color-mix(in oklch, var(--color-primary) 15%, transparent)"
                gradientFrom="var(--color-primary)"
                gradientTo="var(--color-secondary)"
                className="h-full overflow-hidden rounded-[inherit]"
              >
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-full flex-col gap-4 p-5 focus-visible:outline-none"
                >
                  <div
                    className={
                      "flex size-11 items-center justify-center rounded-xl " +
                      c.color
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-heading text-sm font-semibold leading-tight text-foreground">
                      {c.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.count} tools
                    </div>
                  </div>
                </Link>
              </MagicCard>
            </motion.div>
          );
        })}
      </RevealStagger>
    </section>
  );
}
