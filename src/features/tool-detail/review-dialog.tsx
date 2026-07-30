"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { addReview } from "@/app/actions/reviews";
import type { ReviewData } from "@/lib/tools-data";

export function ReviewDialog({
  open,
  onOpenChange,
  toolSlug,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  onSubmitted: (review: ReviewData) => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setError("");
      setSubmitting(false);
      const id = requestAnimationFrame(() => textareaRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (trimmed.length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Review must be at most 1000 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const review = await addReview(toolSlug, trimmed);
      onSubmitted(review);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onOpenChange(false);
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onKeyDown={onKeyDown}
        >
          <button
            type="button"
            aria-label="Close review dialog"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Write a review
              </h2>
              <button
                type="button"
                aria-label="Close review dialog"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience with this tool..."
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-secondary/50 focus:ring-1 focus:ring-secondary/30"
              />

              <div className="mt-2 flex items-center justify-between text-xs">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {content.length}/1000
                  </span>
                )}
                <span className="text-muted-foreground">
                  Ctrl+Enter to submit
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || content.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-transform hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? "Posting..." : "Post review"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
