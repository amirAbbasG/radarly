"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  X,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Flame,
  Minus,
} from "lucide-react";
import { TOOLS, CATEGORIES, type Tool } from "@/lib/tools-data";

const SIGNAL_META: Record<
  Tool["sig"],
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: { label: "Hot", icon: Flame, className: "text-secondary" },
  rising: { label: "Rising", icon: TrendingUp, className: "text-primary" },
  steady: { label: "Steady", icon: Minus, className: "text-muted-foreground" },
};

function catLabel(id: string) {
  return CATEGORIES.find(c => c.id === id)?.label ?? id;
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranked = TOOLS.map(t => {
      if (!q) return { t, rank: 0 };
      const name = t.name.toLowerCase();
      const hook = t.hook.toLowerCase();
      const cat = catLabel(t.cat).toLowerCase();
      const src = t.source.toLowerCase();
      let rank = -1;
      if (name.startsWith(q)) rank = 3;
      else if (name.includes(q)) rank = 2;
      else if (hook.includes(q) || cat.includes(q) || src.includes(q)) rank = 1;
      return { t, rank };
    })
      .filter(r => r.rank >= 0)
      .sort((a, b) => b.rank - a.rank || b.t.score - a.t.score);
    return ranked.map(r => r.t);
  }, [query]);

  // reset when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // clamp active index to results
  useEffect(() => {
    setActive(a => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // keep active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a =>
        results.length ? (a - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) select(results[active]);
    }
  }

  function select(tool: Tool) {
    onOpenChange(false);
    const el = document.getElementById("trending");
    el?.scrollIntoView({ behavior: "smooth" });
    // brief highlight ping via a custom event other components could listen to
    window.dispatchEvent(
      new CustomEvent("radarly:select-tool", { detail: tool.name }),
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search AI tools"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search tools, categories, sources..."
                className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search query"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tools match{" "}
                    <span className="font-medium text-foreground">{`"${query}"`}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a category like {'"'}coding{'"'} or {'"'}design{'"'}.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {results.map((t, i) => {
                    const meta = SIGNAL_META[t.sig];
                    const Icon = meta.icon;
                    const isActive = i === active;
                    return (
                      <li key={t.name}>
                        <button
                          type="button"
                          data-index={i}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => select(t)}
                          className={
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " +
                            (isActive ? "bg-muted" : "hover:bg-muted/60")
                          }
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-xs font-semibold text-foreground">
                            {t.score}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {t.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                                <Icon className={"h-3 w-3 " + meta.className} />
                                <span className={meta.className}>
                                  {meta.label}
                                </span>
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {t.hook}
                            </span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-2 sm:flex">
                            <span className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              {catLabel(t.cat)}
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <ArrowUp className="h-3 w-3" />
                  </kbd>
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <ArrowDown className="h-3 w-3" />
                  </kbd>
                  to navigate
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1">
                    <CornerDownLeft className="h-3 w-3" />
                  </kbd>
                  to select
                </span>
              </span>
              <span className="tabular-nums">
                {results.length} {results.length === 1 ? "result" : "results"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
