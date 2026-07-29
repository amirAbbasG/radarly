"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Tool, Category } from "@/lib/tools-data";
import { ToolCard } from "@/components/common/tool-card";
import { Reveal } from "@/components/common/reveal";

type Sort = "trending" | "score" | "rising";

const SORTS: { id: Sort; label: string }[] = [
  { id: "trending", label: "Trending now" },
  { id: "score", label: "Top momentum" },
  { id: "rising", label: "Fastest rising" },
];

export function TrendingFeed({
  tools,
  categories,
}: {
  tools: Tool[];
  categories: Category[];
}) {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<Sort>("trending");
  const [visible, setVisible] = useState(9);

  const filtered = useMemo(() => {
    let list = tools.filter(t => cat === "all" || t.cat === cat);
    if (sort === "score" || sort === "trending") {
      list = [...list].sort((a, b) => b.score - a.score);
    } else if (sort === "rising") {
      const rank = { hot: 3, rising: 2, steady: 1 };
      list = [...list].sort(
        (a, b) => rank[b.sig] - rank[a.sig] || b.score - a.score,
      );
    }
    return list;
  }, [cat, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <section
      id="trending"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10"
    >
      <Reveal className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Trending right now
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ranked by real momentum across every source — refreshed daily.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {SORTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
                (sort === s.id
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* category chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map(c => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setVisible(9);
              }}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                (active
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground")
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* grid */}
      <motion.div
        layout
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {shown.map((tool, i) => (
            <ToolCard key={tool.name} tool={tool} rank={i + 1} />
          ))}
        </AnimatePresence>
      </motion.div>

      {shown.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
          <p className="text-sm text-muted-foreground">
            No tools yet in this category — check back soon.
          </p>
        </div>
      )}

      {visible < filtered.length && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisible(v => v + 6)}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-secondary hover:text-secondary"
          >
            Load more tools
          </button>
        </div>
      )}
    </section>
  );
}
