import { SOURCES } from '@/lib/tools-data'

export function TrustStrip() {
  const items = [...SOURCES, ...SOURCES]
  return (
    <section aria-label="Sources" className="border-y border-border/60 bg-surface/40 py-6">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Signal sourced from the places builders actually watch
      </p>
      <div className="marquee-mask relative overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap px-5">
          {items.map((s, i) => (
            <span
              key={i}
              className="font-heading text-lg font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
