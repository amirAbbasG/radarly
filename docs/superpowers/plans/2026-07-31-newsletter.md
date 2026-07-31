# Newsletter (The Sunday Signal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake newsletter form with a real subscribe → weekly email → unsubscribe flow backed by Postgres, Resend, and a cron route.

**Architecture:** `newsletter_subscribers` table stores emails + per-subscriber unsub tokens. Subscribe is a server action (mirrors `src/app/actions/contact.ts`). A cron-guarded route `/api/cron/newsletter` pulls top 5 published tools and sends one HTML email per active subscriber via Resend. Unsubscribe is a one-click GET route that soft-deletes by token.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Postgres, Resend (`resend` package), Vercel Cron, hand-written inline-styled HTML template (no react-email).

## Global Constraints

- **Next.js 16.2.6** — breaking changes vs older versions. Route handlers: default-dynamic `GET` (no caching concern). Use `redirect()` from `next/navigation` in route handlers; call it OUTSIDE `try/catch` (it throws `NEXT_REDIRECT`).
- **Own tables snake_case** — own-table columns `snake_case` (see `contact_messages`); only Better Auth tables use camelCase. Do not touch Better Auth tables.
- **Server actions mirror `src/app/actions/contact.ts`** — `"use server"`, `{ success, message }`-style state, validation, try/catch.
- **Route handler auth pattern** mirrors `verifyIngestAuth` in `src/lib/ingest-utils.ts` (Bearer secret comparison → 401).
- **No react-email, no cron lib, no ORM change.** Only new dependency is `resend`.
- **No test harness in repo** — verification is `pnpm exec tsc --noEmit` + `pnpm lint` + manual dev-server checks. No test files.
- IDs via `crypto.randomUUID()`. Emails lowercased. New files kebab-case.
- Site base URL for email links: `process.env.NEXT_PUBLIC_SITE_URL` with fallback `https://radarly.com` (matches existing copy in `contact-page.tsx`).

---

### Task 1: Schema + migration for `newsletter_subscribers`

**Files:**

- Modify: `src/lib/db/schema.ts` (append table after `contactMessages`, ~line 167)
- Create: `drizzle/0005_*.sql` (generated)
- Modify: `drizzle/meta/_journal.json` (generated)

**Interfaces:**

- Consumes: nothing (existing `pgTable`, `text`, `timestamp` imports already present)
- Produces: `newsletterSubscribers` Drizzle table with columns `id: text PK`, `email: text unique notNull`, `unsubToken: text unique notNull`, `subscribedAt: timestamp defaultNow`, `unsubscribedAt: timestamp` (nullable). Used by Tasks 2, 5, 6.

- [ ] **Step 1: Add the table to the schema**

Append to the end of `src/lib/db/schema.ts` (after the `contactMessages` table):

```ts
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  unsubToken: text("unsub_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});
```

- [ ] **Step 2: Generate the migration**

Run: `pnpm exec drizzle-kit generate --name newsletter_subscribers`

Expected: prints `new file: drizzle/0005_<name>.sql` containing `CREATE TABLE IF NOT EXISTS "newsletter_subscribers"` with `CREATE UNIQUE INDEX` on `email` and `unsub_token`.

- [ ] **Step 3: Apply the migration to the local database**

Run: `pnpm exec drizzle-kit migrate`

Expected: `migrations applied` / `successfully applied 1 migration` (requires `DATABASE_URL` in `.env`).

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add newsletter_subscribers table"
```

---

### Task 2: Subscribe server action

**Files:**

- Create: `src/app/actions/newsletter.ts`

**Interfaces:**

- Consumes: `newsletterSubscribers` from `src/lib/db/schema.ts` (Task 1)
- Produces: `type NewsletterState = { success: boolean; message?: string }` and `subscribeToNewsletter(previous: NewsletterState, formData: FormData): Promise<NewsletterState>`. Consumed by Task 3 (form) and re-exportable for tests later.

- [ ] **Step 1: Write the action**

Create `src/app/actions/newsletter.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

export type NewsletterState = {
  success: boolean;
  message?: string;
};

export async function subscribeToNewsletter(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email))
    return { success: false, message: "Enter a valid email." };

  try {
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(newsletterSubscribers).values({
        id: crypto.randomUUID(),
        email,
        unsubToken: crypto.randomUUID(),
      });
    } else if (existing[0].unsubscribedAt !== null) {
      await db
        .update(newsletterSubscribers)
        .set({ unsubscribedAt: null, unsubToken: crypto.randomUUID() })
        .where(eq(newsletterSubscribers.id, existing[0].id));
    }

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Could not subscribe. Please try again.",
    };
  }
}
```

Behavior notes: already-active subscriber → silent success (no leak of who's subscribed). Re-subscribe after unsubscribe → clears `unsubscribedAt`, rotates the token. Duplicate race is caught by the unique index → generic failure message.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/newsletter.ts
git commit -m "feat: add newsletter subscribe server action"
```

---

### Task 3: Wire the newsletter form

**Files:**

- Modify: `src/features/home/newsletter.tsx`

**Interfaces:**

- Consumes: `subscribeToNewsletter`, `NewsletterState` from `@/app/actions/newsletter` (Task 2)
- Produces: nothing new; the existing `done` UI state now reflects real server success

- [ ] **Step 1: Rewrite the component to use the server action**

Replace the contents of `src/features/home/newsletter.tsx`:

```tsx
"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/common/reveal";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import type { NewsletterState } from "@/app/actions/newsletter";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, {
    success: false,
  } as NewsletterState);

  useEffect(() => {
    if (state.success) setDone(true);
    else if (state.message) toast.error(state.message);
  }, [state.success, state.message]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const fd = new FormData();
    fd.set("email", email);
    startTransition(() => formAction(fd));
  }

  return (
    <section
      id="newsletter"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10"
    >
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
              The best AI tools, ranked by real momentum. Delivered every
              Sunday. No spam, unsubscribe anytime.
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
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                >
                  {isPending ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev`; open the homepage; submit `you@example.com`.

Expected: toast-free success state "You're on the list — see you Sunday." Verify the row landed:

```sql
SELECT email, "unsub_token", "subscribed_at", "unsubscribed_at"
FROM newsletter_subscribers;
```

Expected: one row, `unsubscribed_at` NULL. Submit the same email again → same success (no error toast, no new row).

- [ ] **Step 4: Commit**

```bash
git add src/features/home/newsletter.tsx
git commit -m "feat: wire newsletter form to subscribe action"
```

---

### Task 4: Email digest template

**Files:**

- Create: `src/lib/newsletter/email-template.ts`

**Interfaces:**

- Consumes: `Tool` type from `@/lib/tools-data`
- Produces: `buildDigest(tools: Tool[], unsubToken: string, baseUrl: string): string`. Consumed by Task 6 (cron route). Pure function — no imports beyond `Tool`.

- [ ] **Step 1: Write the template builder**

Create `src/lib/newsletter/email-template.ts`:

```ts
import type { Tool } from "@/lib/tools-data";

export function buildDigest(
  tools: Tool[],
  unsubToken: string,
  baseUrl: string,
): string {
  const rows = tools
    .map((t, i) => {
      const url = `${baseUrl}/tools/${encodeURIComponent(t.slug)}`;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eee;">
            <div style="font-size:11px;color:#8a8a8a;margin-bottom:2px;">#${i + 1}</div>
            <a href="${url}" style="font-size:16px;font-weight:600;color:#111;text-decoration:none;">${escapeHtml(t.name)}</a>
            <div style="font-size:13px;color:#555;margin-top:2px;">${escapeHtml(t.hook)}</div>
          </td>
        </tr>`;
    })
    .join("");

  const unsubUrl = `${baseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#111;color:#fff;">
                <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;">The Sunday Signal</div>
                <h1 style="margin:8px 0 0;font-size:22px;">Trending AI tools this week</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <a href="${unsubUrl}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

Note: `escapeHtml` guards against HTML injection from tool names (which come from external ingest sources). Empty `tools` array → table body with no rows; that's acceptable — cron route still sends, recipient sees header + unsubscribe. (`tools/` link paths match the existing route in `src/app/tools/[slug]/page.tsx`.)

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual render check**

Run `pnpm dev`, then in a scratch file `src/lib/newsletter/__scratch.ts` (deleted after) or via a one-off:

```ts
import { buildDigest } from "@/lib/newsletter/email-template";
const html = buildDigest(
  [{ name: "<b>Zoomer</b>", slug: "zoomer", hook: "GenZ voice clone" } as any],
  "abc123",
  "https://radarly.com",
);
console.log(
  html.includes("&lt;b&gt;Zoomer&lt;/b&gt;"),
  html.includes("unsubscribe?token=abc123"),
);
```

Expected: `true true` (names escaped, unsub token embedded).

- [ ] **Step 4: Commit**

```bash
git add src/lib/newsletter/email-template.ts
git commit -m "feat: add newsletter digest email template"
```

---

### Task 5: Unsubscribe route + confirmation page

**Files:**

- Create: `src/app/newsletter/unsubscribe/route.ts`
- Create: `src/app/newsletter/unsubscribed/page.tsx`

**Interfaces:**

- Consumes: `newsletterSubscribers` + `eq` (Task 1)
- Produces: route `GET /newsletter/unsubscribe?token=<uuid>` → 307 to `/newsletter/unsubscribed`; page `/newsletter/unsubscribed` (static server component). Unsub URL pattern consumed by Task 4's template and Task 6's send loop.

- [ ] **Step 1: Write the unsubscribe route**

Create `src/app/newsletter/unsubscribe/route.ts`:

```ts
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  if (token) {
    await db
      .update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.unsubToken, token));
  }

  redirect("/newsletter/unsubscribed");
}
```

`redirect()` is called outside any try/catch (it throws `NEXT_REDIRECT`). Invalid/unknown token still redirects to the neutral confirmation page — no email enumeration, no distinct error state. DB failure on a real token surfaces as a 500; acceptable for a one-click unsub link (email clients don't show the body anyway).

- [ ] **Step 2: Write the confirmation page**

Create `src/app/newsletter/unsubscribed/page.tsx`:

```tsx
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
```

(Confirm `MailX` exists in the installed `lucide-react` — if the typecheck fails on it, swap to `MailCheck` or `Check`.)

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `pnpm dev`. Grab a real `unsub_token` from the row created in Task 3. Hit `http://localhost:3000/newsletter/unsubscribe?token=<token>`.

Expected: 307 redirect to `/newsletter/unsubscribed`; the confirmation page renders; the DB row now has `unsubscribed_at` set. Repeat the same URL → still 307 (idempotent, no error). Hit with garbage token → still 307 to neutral page.

- [ ] **Step 5: Commit**

```bash
git add src/app/newsletter/unsubscribe/route.ts src/app/newsletter/unsubscribed/page.tsx
git commit -m "feat: add one-click newsletter unsubscribe"
```

---

### Task 6: Install Resend + cron send route + deploy config

**Files:**

- Create: `src/app/api/cron/newsletter/route.ts`
- Create: `vercel.json`
- Modify: `.env.example`
- Modify: `package.json` (add `resend`)

**Interfaces:**

- Consumes: `buildDigest` from `@/lib/newsletter/email-template` (Task 4), `newsletterSubscribers` (Task 1), `rowToTool` from `@/lib/data`
- Produces: route `GET /api/cron/newsletter` (Bearer `CRON_SECRET`), Vercel cron `0 9 * * 0`

- [ ] **Step 1: Install Resend**

Run: `pnpm add resend`

Expected: `resend` added to `dependencies` in `package.json`.

- [ ] **Step 2: Write the cron route**

Create `src/app/api/cron/newsletter/route.ts`:

```ts
import { desc, eq, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { tools, newsletterSubscribers } from "@/lib/db/schema";
import { rowToTool } from "@/lib/data";
import { buildDigest } from "@/lib/newsletter/email-template";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://radarly.com";
const from = process.env.NEWSLETTER_FROM ?? "Radarly <hello@radarly.ai>";

export async function GET(req: Request) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const toolRows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore))
    .limit(5);

  const subs = await db
    .select()
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));

  const digest = buildDigest(toolRows.map(rowToTool), "__unused__", baseUrl);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `The Sunday Signal — ${new Date().toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
    },
  )}`;

  let sent = 0;
  const failures: string[] = [];

  for (const sub of subs) {
    const html = digest.replace(
      "__unused__",
      encodeURIComponent(sub.unsubToken),
    );
    try {
      await resend.emails.send({
        from,
        to: sub.email,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      failures.push(sub.email);
      console.error("newsletter send failed for", sub.email, err);
    }
  }

  return Response.json({ ok: true, sent, failed: failures.length });
}
```

Notes:

- One digest build, then per-subscriber token injected via string replace (template is built once, tokens substituted per row — avoids rebuilding the whole HTML per email).
- Per-email failures logged and counted, loop continues.
- `dynamic = "force-dynamic"` and `maxDuration = 60` explicit — route handlers are dynamic by default in Next 16 but the segment config is worth being explicit for a cron that sends many emails.

- [ ] **Step 3: Write Vercel cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/newsletter",
      "schedule": "0 9 * * 0"
    }
  ]
}
```

Schedule: every Sunday 09:00 UTC. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when the `CRON_SECRET` env var is set in the project. (Manual trigger = `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/newsletter`.)

- [ ] **Step 4: Update `.env.example`**

Append to `src/.env.example` — file is at repo root, `F:\projects\personal\next js\radarly\.env.example`:

```
# Newsletter
RESEND_API_KEY=    # Resend API key (app.resend.com)
CRON_SECRET=       # Random string; Vercel Cron + manual curl auth
NEXT_PUBLIC_SITE_URL=https://radarly.com  # Base URL used in email links
NEWSLETTER_FROM=Radarly <hello@radarly.ai>
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm exec tsc --noEmit`
Run: `pnpm lint`

Expected: both clean. (If `resend` ships types that trip the existing ESLint config, fix only the triggered rule, don't widen config.)

- [ ] **Step 6: Manual smoke test (auth + dry-fail path)**

Run: `pnpm dev`.

1. `curl http://localhost:3000/api/cron/newsletter` → 401 Unauthorized.
2. `curl -H "Authorization: Bearer wrong-secret" http://localhost:3000/api/cron/newsletter` → 401.
3. With `CRON_SECRET` set correctly in `.env` but no `RESEND_API_KEY`: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/newsletter` → 500 "RESEND_API_KEY not configured".
4. (Optional, only if you have a real key + verified sender domain) add a real subscriber, run with a valid key → `{"ok":true,"sent":1,"failed":0}`, email arrives with a working unsubscribe link.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/cron/newsletter/route.ts vercel.json .env.example package.json
git commit -m "feat: add weekly newsletter cron send via Resend"
```

---

## Self-Review Notes

- **Spec coverage:** schema ✓ (Task 1), subscribe ✓ (Task 2-3), weekly send ✓ (Task 6), unsubscribe ✓ (Task 5), email template ✓ (Task 4), env/vercel.json ✓ (Task 6). Manual-trigger path = same route + curl (documented in Task 6 Step 3). Rate limiting deferred as a known gap (matches spec).
- **Type consistency:** `NewsletterState` and `subscribeToNewsletter` defined in Task 2, consumed as named in Task 3. `buildDigest(tools, unsubToken, baseUrl)` defined in Task 4, called with exactly those args in Task 6. `newsletterSubscribers` column names (`unsubToken`, `unsubscribedAt`, `email`) used identically in Tasks 1, 2, 5, 6.
- **No placeholders:** every step has concrete code or commands; manual smoke tests use real tokens from the DB.
