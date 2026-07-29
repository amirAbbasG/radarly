"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Clock, Mail, MessagesSquare, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealStagger,
  itemVariants,
} from "@/components/common/reveal";

const CONTACT_EMAIL = "hello@radarly.ai";

const SUBJECTS = [
  "General inquiry",
  "Press",
  "Partnership",
  "Bug report",
  "Other",
] as const;

const SIDE_POINTS = [
  {
    icon: Clock,
    title: "Response time",
    body: "We reply to most messages within 2 business days. Press and partnership requests usually move faster.",
  },
  {
    icon: ShieldCheck,
    title: "Spam filter note",
    body: "Opening your mail client helps our spam filters trust you. Messages through social DMs may take longer.",
  },
  {
    icon: MessagesSquare,
    title: "Pick the right channel",
    body: "Tell us the context so we get it to the right person the first time.",
  },
];

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background/60 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 aria-[invalid=true]:border-destructive";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function ContactPage() {
  const reduce = useReducedMotion();
  const [sent, setSent] = useState({ value: false, href: "" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number] | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email.";
    if (!subject) next.subject = "Choose a subject.";
    if (message.trim().length < 10) next.message = "Write at least 10 chars.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const mailtoHref = useMemo(() => {
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      message,
      "",
      `— sent via radarly.com/contact`,
    ].join("\n");
    const params = new URLSearchParams({
      subject: `[${subject}] ${truncateForHeader(name)}`,
      body,
    });
    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  }, [name, email, subject, message]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    window.location.href = mailtoHref;
    setSent({ value: true, href: mailtoHref });
  }

  return (
    <main className="relative">
      <ContactHero reduce={!!reduce} />

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
        <RevealStagger className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          {/* Info panel */}
          <motion.aside variants={itemVariants} className="order-2 lg:order-1">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface/40 p-6">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                What to expect
              </h2>
              <ol className="mt-5 space-y-5">
                {SIDE_POINTS.map(p => (
                  <li key={p.title} className="flex gap-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-secondary">
                      <p.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {p.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-3 text-xs text-muted-foreground transition-colors hover:border-secondary/60"
              >
                <Mail className="h-4 w-4 shrink-0 text-secondary" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </motion.aside>

          {/* Form / success */}
          <motion.div variants={itemVariants} className="order-1 lg:order-2">
            <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-8">
              {sent.value ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 18,
                    }}
                    className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
                  >
                    <Send className="h-6 w-6" />
                  </motion.div>
                  <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-balance text-foreground">
                    Your mail client should have opened.
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
                    If nothing happened, your browser may block
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                      mailto:
                    </code>
                    links. Email us directly at{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-medium text-secondary underline-offset-4 hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    .
                  </p>
                  <div className="mt-7 flex justify-center gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setSent({ value: false, href: "" });
                      }}
                    >
                      Write another message
                    </Button>
                    <Button size="lg" render={<a href={sent.href} />}>
                      <Send className="h-4 w-4" />
                      Open mail again
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className={labelClass}>
                          Your name
                        </label>
                        <input
                          id="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Ada Lovelace"
                          className={inputClass}
                          aria-invalid={!!errors.name}
                          maxLength={80}
                        />
                        <FieldError message={errors.name} />
                      </div>
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputClass}
                          aria-invalid={!!errors.email}
                        />
                        <FieldError message={errors.email} />
                      </div>
                    </div>

                    <div>
                      <span className={labelClass}>Subject</span>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map(s => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setSubject(s)}
                            className={
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                              (subject === s
                                ? "border-secondary bg-secondary/15 text-secondary"
                                : "border-border bg-surface/60 text-muted-foreground hover:border-secondary/60 hover:text-foreground")
                            }
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <FieldError message={errors.subject} />
                    </div>

                    <div>
                      <label htmlFor="message" className={labelClass}>
                        Message
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind."
                        rows={6}
                        maxLength={2000}
                        className={
                          inputClass +
                          " h-auto resize-none py-2.5 leading-relaxed"
                        }
                        aria-invalid={!!errors.message}
                      />
                      <div className="mt-1.5 flex items-center justify-between">
                        <FieldError message={errors.message} />
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                          {message.length}/2000
                        </span>
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      <Send className="h-4 w-4" />
                      Open my mail client
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Sending opens your email app — no data stored on our
                      servers.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </RevealStagger>
      </section>
    </main>
  );
}

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

function ContactHero({ reduce }: { reduce: boolean }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-12 sm:pt-36 lg:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 size-[640px] -translate-x-1/2 opacity-[0.12]"
      >
        <div className="absolute inset-0 rounded-full border border-secondary/40" />
        <div className="absolute inset-[12%] rounded-full border border-secondary/30" />
        <div className="absolute inset-[26%] rounded-full border border-secondary/20" />
        <div className="absolute inset-[40%] rounded-full border border-secondary/20" />
        {!reduce && (
          <motion.div
            className="absolute inset-0 origin-center"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--secondary) 40deg, transparent 60deg)",
              borderRadius: "9999px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          />
        )}
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Reveal>
            <Badge variant="secondary" className="w-fit">
              Get in touch
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Drop us a signal
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Questions, press, partnerships, or something broken on the radar?
              We read everything.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function truncateForHeader(value: string) {
  return value.length > 80 ? value.slice(0, 77) + "…" : value;
}
