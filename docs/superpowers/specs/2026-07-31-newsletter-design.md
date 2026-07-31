# Newsletter (The Sunday Signal)

## Problem

`src/features/home/newsletter.tsx` is a fake form: it validates email client-side, then just flips a `done` state. No server-side storage, no weekly send, no unsubscribe. The "No spam, unsubscribe anytime" copy is a lie.

## Architecture

```
Newsletter form (client)
  └── subscribeToNewsletter() server action ──► Drizzle ──► newsletter_subscribers

Vercel Cron (Sun 09:00) ──► GET /api/cron/newsletter  (CRON_SECRET guard)
  └── top 5 published tools by trendingScore ──► Resend ──► 1 email / subscriber

Email body "Unsubscribe" link ──► GET /newsletter/unsubscribe?token=...
  └── soft delete (unsubscribedAt) ──► confirmation page
```

Three moving parts: subscribe, send, unsubscribe. Each independently testable.

## Data Flow

**Subscribe**

1. User submits email → `subscribeToNewsletter` server action (mirrors `contact.ts`: form-state, validation, try/catch)
2. Insert row: `email` (lowercased), `unsubToken = crypto.randomUUID()`, `subscribedAt`
3. Duplicate email → return `{ success: true }` silently (don't leak who's subscribed)
4. Client shows existing "You're on the list" state

**Weekly send**

1. Cron fires `GET /api/cron/newsletter` with `Authorization: Bearer CRON_SECRET`
2. Reject 401 if secret mismatch; manual `curl` sends the same header
3. Query top 5 `published` tools ordered by `trendingScore DESC`
4. Query active subscribers (`unsubscribedAt IS NULL`)
5. Build HTML string template, one `resend.emails.send` per subscriber with their unsub token
6. Per-email failure logged, loop continues

**Unsubscribe**

1. Email link → `GET /newsletter/unsubscribe?token=...`
2. If token matches: set `unsubscribedAt = now()`
3. Redirect to `/newsletter/unsubscribed` confirmation page
4. Unknown/expired token → redirect to a neutral "already unsubscribed / invalid link" page (no email enumeration)

## Files Changed

| File                                       | Change                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `src/lib/db/schema.ts`                     | Add `newsletterSubscribers` table                                      |
| `drizzle/` (migration)                     | New migration for `newsletter_subscribers`                             |
| `src/app/actions/newsletter.ts`            | New: `subscribeToNewsletter` server action                             |
| `src/app/api/cron/newsletter/route.ts`     | New: cron route (CRON_SECRET guard, top-tools query, Resend send loop) |
| `src/app/newsletter/unsubscribe/route.ts`  | New: one-click GET unsubscribe                                         |
| `src/app/newsletter/unsubscribed/page.tsx` | New: confirmation page (handles both success + invalid-token states)   |
| `src/lib/newsletter/email-template.ts`     | New: HTML string builder for the digest                                |
| `src/features/home/newsletter.tsx`         | Call server action instead of local `setDone`                          |
| `.env.example`                             | Add `RESEND_API_KEY`, `CRON_SECRET`                                    |
| `vercel.json`                              | New: cron schedule `0 9 * * 0` + `CRON_SECRET` env passthrough         |

### Schema (`src/lib/db/schema.ts`)

```ts
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  unsubToken: text("unsub_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});
```

### Subscribe action (`src/app/actions/newsletter.ts`)

```ts
"use server";
// state type: { success: boolean; message?: string } — same shape as contact.ts
// insert { id: crypto.randomUUID(), email, unsubToken: crypto.randomUUID() }
// duplicate key → still return success (catch unique-violation or check first)
```

### Unsubscribe route (`src/app/newsletter/unsubscribe/route.ts`)

```ts
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token)
    await db
      .update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.unsubToken, token));
  return NextResponse.redirect(new URL("/newsletter/unsubscribed", req.url));
}
```

### Cron route (`src/app/api/cron/newsletter/route.ts`)

```ts
// GET only. Validate `Authorization: Bearer ${process.env.CRON_SECRET}` → 401 if mismatch.
// topTools = db.select().from(tools).where(eq(tools.status, "published")).orderBy(desc(tools.trendingScore)).limit(5)
// subs = db.select().from(newsletterSubscribers).where(isNull(newsletterSubscribers.unsubscribedAt))
// for each sub: resend.emails.send({ from, to: sub.email, subject, html: buildDigest(topTools, sub.unsubToken) })
//   catch per-email, log, continue
// return { sent, failed }
```

### Email template (`src/lib/newsletter/email-template.ts`)

Pure function `buildDigest(tools: Tool[], unsubToken: string): string`. Simple inline-styled HTML table/list (Resend sends HTML directly). Unsubscribe link: `https://<site>/newsletter/unsubscribe?token=${unsubToken}`. No react-email dependency.

## Dependencies

- `resend` (only new package)
- No react-email, no cron lib, no ORM change

## Error Handling

- Subscribe: try/catch → generic failure message (no leak), duplicate → silent success
- Cron: 401 on bad secret; per-email catch so one failure doesn't kill the batch
- Unsubscribe: invalid token → neutral page, no "that email wasn't subscribed" distinction

## Security

- `CRON_SECRET` from env, never hardcoded
- Unsub token = unguessable UUID; no email lookup by address
- No user-facing enumeration of subscription status
- Subscribe action rate limiting: none in repo today (consistent with `contact.ts`) — noted as known gap

## Testing

No test infra in repo. Consistent with existing actions: manual verification via dev server (subscribe → check row, curl cron with secret → check Resend, click unsub link → check row). Add tests only if/when repo gains a harness.
