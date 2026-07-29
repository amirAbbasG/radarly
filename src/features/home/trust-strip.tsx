import { Marquee } from "@/components/ui/marquee";

const SOURCES = [
  "Product Hunt",
  "GitHub",
  "Hacker News",
  "Dev.to",
  "Reddit",
  "Twitter/X",
];

export function TrustStrip() {
  return (
    <section
      aria-label="Sources"
      className="border-y border-border/60 bg-surface/40 py-6"
    >
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Signal sourced from the places builders actually watch
      </p>
      <Marquee className="marquee-mask [--duration:28s]" pauseOnHover>
        {SOURCES.map((s, i) => (
          <span
            key={i}
            className="font-heading text-lg font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            {s}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
