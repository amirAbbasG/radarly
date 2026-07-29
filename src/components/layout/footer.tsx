import { RadarMark } from "@/components/common/logo";

const COLS = [
  {
    title: "Discover",
    links: [
      { label: "Trending", href: "/#trending" },
      { label: "Tool of the Week", href: "/#tool-of-week" },
      { label: "Categories", href: "/#categories" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/about#methodology" },
      { label: "Submit a Tool", href: "/submit" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Newsletter", href: "/#newsletter" },
      { label: "FAQ", href: "/about#faq" },
      { label: "Transparency", href: "/about#transparency" },
      { label: "Home", href: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2">
              <RadarMark className="h-6 w-6 text-secondary" />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                Radarly
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The signal, not the noise. Trending AI tools ranked by real
              momentum, scanned daily so you don&apos;t have to.
            </p>
          </div>
          {COLS.map(col => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Radarly. Built for builders.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            Radar active · last scan 2h ago
          </div>
        </div>
      </div>
    </footer>
  );
}
