"use client";

import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Radar,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  submitTool,
  type SubmissionState,
} from "@/app/actions/tool-submissions";

const CATEGORIES = [
  "AI assistants",
  "Developer tools",
  "Design & creative",
  "Marketing & sales",
  "Productivity",
  "Research & data",
  "Other",
];

const REVIEW_STEPS = [
  {
    icon: Radar,
    title: "Signal scan",
    body: "Our agent pulls activity from Product Hunt, GitHub, HN and Reddit.",
  },
  {
    icon: TrendingUp,
    title: "Momentum score",
    body: "We measure real traction, not follower counts or launch-day spikes.",
  },
  {
    icon: ShieldCheck,
    title: "Human review",
    body: "An editor verifies the tool before it reaches the public radar.",
  },
];

const initialState: SubmissionState = { success: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 text-xs font-medium text-destructive"
    >
      {message}
    </motion.p>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background/60 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 aria-[invalid=true]:border-destructive";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function SubmitToolExperience() {
  const [state, formAction, pending] = useActionState(submitTool, initialState);
  const [step, setStep] = useState(0);
  const [toolName, setToolName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const errors = state.errors ?? {};
  const descCount = description.length;

  const hostPreview = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const parsed = new URL(
        /^https?:\/\//i.test(url) ? url : `https://${url}`,
      );
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [url]);

  const step1Ready =
    toolName.trim().length >= 2 && !!hostPreview && category !== "";

  if (state.success) {
    return (
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.5 }}
            className="rounded-3xl border border-border bg-card/70 p-10 text-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>
            <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-foreground text-balance">
              {state.message ?? "Your tool is now on our radar."}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
              We&apos;ll scan its momentum over the coming days. If the signal
              is strong, it&apos;ll surface on the public radar—no follow-up
              needed.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => window.location.reload()}>
                <Send className="h-4 w-4" />
                Submit another tool
              </Button>
              <a
                href="/public#trending"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Browse the radar
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Nominate for the radar
          </span>
          <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl">
            Put a tool on the radar
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            Found an AI product that&apos;s quietly taking off? Nominate it. We
            measure real momentum, verify it by hand, and surface only the
            signal.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          {/* Trust / review panel */}
          <aside className="order-2 lg:order-1">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface/40 p-6">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                How review works
              </h2>
              <ol className="mt-5 space-y-5">
                {REVIEW_STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-secondary">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {i + 1}. {s.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-secondary" />
                No pay-to-list. Ranking is earned through measured momentum.
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-8">
              {/* Step indicator */}
              <div className="mb-7 flex items-center gap-3">
                {[0, 1].map(s => (
                  <div key={s} className="flex flex-1 items-center gap-3">
                    <span
                      className={
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors " +
                        (step >= s
                          ? "bg-secondary text-secondary-foreground"
                          : "border border-border bg-surface text-muted-foreground")
                      }
                    >
                      {s + 1}
                    </span>
                    <span
                      className={
                        "text-xs font-medium " +
                        (step >= s
                          ? "text-foreground"
                          : "text-muted-foreground")
                      }
                    >
                      {s === 0 ? "The tool" : "Context"}
                    </span>
                    {s === 0 && <span className="h-px flex-1 bg-border" />}
                  </div>
                ))}
              </div>

              <form action={formAction}>
                {step === 1 && (
                  <>
                    <input type="hidden" name="toolName" value={toolName} />
                    <input type="hidden" name="canonicalUrl" value={url} />
                    <input type="hidden" name="category" value={category} />
                  </>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {step === 0 ? (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-5"
                    >
                      <div>
                        <label htmlFor="toolName" className={labelClass}>
                          Tool name
                        </label>
                        <input
                          id="toolName"
                          name="toolName"
                          value={toolName}
                          onChange={e => setToolName(e.target.value)}
                          placeholder="e.g. Radarly"
                          className={inputClass}
                          aria-invalid={!!errors.toolName}
                          maxLength={80}
                        />
                        <FieldError message={errors.toolName} />
                      </div>

                      <div>
                        <label htmlFor="canonicalUrl" className={labelClass}>
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="canonicalUrl"
                            name="canonicalUrl"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="yourtool.com"
                            className={inputClass + " pl-9"}
                            aria-invalid={!!errors.canonicalUrl}
                            inputMode="url"
                          />
                        </div>
                        {hostPreview && !errors.canonicalUrl && (
                          <p className="mt-1.5 text-xs text-secondary">
                            Linking to {hostPreview}
                          </p>
                        )}
                        <FieldError message={errors.canonicalUrl} />
                      </div>

                      <div>
                        <span className={labelClass}>Category</span>
                        <input type="hidden" name="category" value={category} />
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setCategory(c)}
                              className={
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                                (category === c
                                  ? "border-secondary bg-secondary/15 text-secondary"
                                  : "border-border bg-surface/60 text-muted-foreground hover:border-secondary/60 hover:text-foreground")
                              }
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <FieldError message={errors.category} />
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        disabled={!step1Ready}
                        onClick={() => setStep(1)}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-5"
                    >
                      <div>
                        <label htmlFor="description" className={labelClass}>
                          Why it matters
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="What does it do, and why is it gaining momentum right now?"
                          rows={4}
                          maxLength={500}
                          className={
                            inputClass +
                            " h-auto resize-none py-2.5 leading-relaxed"
                          }
                          aria-invalid={!!errors.description}
                        />
                        <div className="mt-1.5 flex items-center justify-between">
                          <FieldError message={errors.description} />
                          <span
                            className={
                              "ml-auto text-xs tabular-nums " +
                              (descCount >= 40
                                ? "text-secondary"
                                : "text-muted-foreground")
                            }
                          >
                            {descCount}/500
                          </span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="evidenceUrl" className={labelClass}>
                          Traction link{" "}
                          <span className="normal-case text-muted-foreground/70">
                            (optional)
                          </span>
                        </label>
                        <input
                          id="evidenceUrl"
                          name="evidenceUrl"
                          placeholder="Product Hunt, GitHub, launch thread…"
                          className={inputClass}
                          aria-invalid={!!errors.evidenceUrl}
                          inputMode="url"
                        />
                        <FieldError message={errors.evidenceUrl} />
                      </div>

                      <div>
                        <label htmlFor="submitterEmail" className={labelClass}>
                          Your email
                        </label>
                        <input
                          id="submitterEmail"
                          name="submitterEmail"
                          type="email"
                          placeholder="you@example.com"
                          className={inputClass}
                          aria-invalid={!!errors.submitterEmail}
                        />
                        <FieldError message={errors.submitterEmail} />
                      </div>

                      {state.message && !state.success && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                          {state.message}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          onClick={() => setStep(0)}
                          disabled={pending}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          className="flex-1"
                          disabled={pending}
                        >
                          {pending ? "Submitting…" : "Submit to radar"}
                          {!pending && <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
