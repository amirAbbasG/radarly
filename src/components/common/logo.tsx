import Link from "next/link";

export function RadarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="13"
        cy="13"
        r="12"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />
      <circle
        cx="13"
        cy="13"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <path
        d="M13 13 L13 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="13" cy="13" r="2.4" fill="currentColor" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={"flex items-center gap-2 " + (className ?? "")}
    >
      <RadarMark className="h-6 w-6 text-secondary" />
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        Radarly
      </span>
    </Link>
  );
}
