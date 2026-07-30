"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Flame,
  Radio,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { ToolCard } from "@/components/common/tool-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryProfile, Signal, Tool } from "@/lib/tools-data";

type SortMode = "momentum" | "source" | "name";
type SignalFilter = "all" | Signal;

const signalOptions: { value: SignalFilter; label: string }[] = [
  { value: "all", label: "All signals" },
  { value: "hot", label: "Hot" },
  { value: "rising", label: "Rising" },
  { value: "steady", label: "Steady" },
];

const sortOptions = [
  { value: "momentum", label: "Top momentum" },
  { value: "source", label: "Source" },
  { value: "name", label: "A–Z" },
];

const accentClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function CategoryExperience({
  category,
  tools,
  relatedCategories,
}: {
  category: CategoryProfile;
  tools: Tool[];
  relatedCategories: CategoryProfile[];
}) {
  const [query, setQuery] = useState("");
  const [signal, setSignal] = useState<SignalFilter>("all");
  const [sort, setSort] = useState<SortMode>("momentum");
  const reduceMotion = useReducedMotion();

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tools
      .filter(tool => {
        const matchesQuery =
          !normalized ||
          tool.name.toLowerCase().includes(normalized) ||
          tool.hook.toLowerCase().includes(normalized) ||
          tool.source.toLowerCase().includes(normalized);
        const matchesSignal = signal === "all" || tool.sig === signal;
        return matchesQuery && matchesSignal;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "source") return a.source.localeCompare(b.source);
        return b.score - a.score;
      });
  }, [query, signal, sort, tools]);

  const averageScore = tools.length
    ? Math.round(
        tools.reduce((total, tool) => total + tool.score, 0) / tools.length,
      )
    : 0;
  const leadingSignal = tools.some(tool => tool.sig === "hot")
    ? "Hot"
    : "Rising";
  const sourceCount = new Set(tools.map(tool => tool.source)).size;
  const hasFilters = query.length > 0 || signal !== "all";

  function clearFilters() {
    setQuery("");
    setSignal("all");
  }

  return (
    <div className="overflow-hidden">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-10 pt-24 sm:px-6 md:pb-16 md:pt-28 lg:px-10">
          <Link
            href="/#categories"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All categories
          </Link>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl ${accentClasses[category.accent]}`}
                >
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Category radar
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-balance text-foreground sm:text-6xl">
                {category.label}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {category.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:w-[25rem]">
              <Metric label="Tracked" value={String(category.count)} />
              <Metric label="Radar score" value={String(averageScore)} />
              <Metric label="Lead signal" value={leadingSignal} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="mb-8 flex flex-col gap-5 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex max-w-3xl items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Radio className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-secondary">
                Radar read
              </p>
              <p className="mt-2 font-heading text-base font-semibold leading-relaxed text-foreground sm:text-lg">
                {category.radarRead}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" aria-hidden="true" />
            {sourceCount} live sources
          </div>
        </motion.div>

        <div className="sticky top-16 z-20 mb-8 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur md:top-20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search tools in {category.label}</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={`Search ${category.label.toLowerCase()}...`}
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </label>

            <div
              className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:pb-0"
              aria-label="Filter by signal"
            >
              {signalOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSignal(option.value)}
                  aria-pressed={signal === option.value}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    signal === option.value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              value={sort}
              onValueChange={value => setSort(value as SortMode)}
              items={sortOptions}
            >
              <SelectTrigger
                className="h-10 min-w-44 shrink-0 bg-card"
                aria-label="Sort tools"
              >
                <SlidersHorizontal aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="momentum">Top momentum</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="name">A–Z</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-secondary">
              Live index
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"} on the radar
            </h2>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <TrendingUp className="size-4 text-secondary" aria-hidden="true" />
            Updated continuously
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredTools.length > 0 ? (
            <motion.div
              layout
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredTools.map((tool, index) => (
                <ToolCard key={tool.name} tool={tool} rank={index + 1} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-xl font-semibold text-foreground">
                No signal found
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Try another keyword or reset the signal filter to see the full
                category radar.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="mb-7 flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-secondary">
                Keep exploring
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">
                Adjacent signals
              </h2>
            </div>
            <Link
              href="/#categories"
              className="hidden items-center gap-2 text-sm font-semibold text-foreground hover:text-secondary sm:flex"
            >
              View all categories
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedCategories.map(related => (
              <Link
                key={related.id}
                href={`/categories/${related.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-1 hover:border-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {related.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {related.count} tools tracked
                  </p>
                </div>
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-secondary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="font-heading text-lg font-bold text-foreground sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
