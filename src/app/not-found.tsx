import Link from "next/link";
import { Radar } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-3xl border border-border bg-card px-8 py-16">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary/10">
          <Radar className="size-8 text-secondary" />
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          404 — Signal lost
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The page you&apos;re looking for isn&apos;t on our radar. It may have
          been moved, or it never existed.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Back to radar
          </Link>
          <Link
            href="/about"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-secondary hover:text-secondary"
          >
            Learn more
          </Link>
        </div>
      </div>
    </main>
  );
}
