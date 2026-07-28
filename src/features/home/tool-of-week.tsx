import { ArrowUpRight, Trophy } from 'lucide-react'
import { Sparkline } from '@/components/common/sparkline'
import { NumberTicker } from '@/components/common/number-ticker'
import { Reveal } from '@/components/common/reveal'
import { TOOL_OF_WEEK } from '@/lib/tools-data'

export function ToolOfWeek() {
  const t = TOOL_OF_WEEK
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col">
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                <Trophy className="h-3.5 w-3.5" />
                Tool of the Week
              </span>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t.name}
              </h2>
              <p className="mt-3 max-w-lg text-pretty leading-relaxed text-muted-foreground">
                {t.hook}
              </p>

              <dl className="mt-6 flex flex-wrap gap-6">
                {t.stats.map((s) => (
                  <div key={s.label}>
                    <dd className="font-heading text-xl font-bold text-foreground">
                      {s.value}
                    </dd>
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-8">
                <a
                  href="#trending"
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 active:scale-95"
                >
                  See why it&apos;s rising
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* momentum panel */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface/60 p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Momentum score
                </span>
                <NumberTicker
                  value={t.score}
                  className="font-heading text-4xl font-bold text-gradient"
                />
              </div>
              <div className="mt-6 h-24 w-full text-secondary">
                <Sparkline
                  points={t.spark}
                  className="h-24 w-full"
                  width={320}
                  height={96}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                14-day trend · accelerating across all tracked sources
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
