import { MailX } from "lucide-react";

export default function UnsubscribedPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-10">
        <span className="mx-auto mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <MailX className="h-5 w-5" />
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
          You&apos;re unsubscribed
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
          Sorry to see you go. You won&apos;t receive The Sunday Signal anymore.
          The link you followed is now spent — no further action needed.
        </p>
      </div>
    </main>
  );
}
