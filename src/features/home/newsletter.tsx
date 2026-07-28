'use client'

import { useState } from 'react'
import { Check, Mail } from 'lucide-react'
import { Reveal } from '@/components/common/reveal'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setDone(true)
  }

  return (
    <section id="newsletter" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-secondary/10 to-transparent" />
          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
              <Mail className="h-3.5 w-3.5" />
              The Sunday Signal
            </span>
            <h2 className="mx-auto max-w-xl font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Get what&apos;s trending, once a week
            </h2>
            <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
              The best AI tools, ranked by real momentum. Delivered every Sunday. No
              spam, unsubscribe anytime.
            </p>

            {done ? (
              <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-5 py-3 text-sm font-medium text-secondary">
                <Check className="h-4 w-4" />
                You&apos;re on the list — see you Sunday.
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
