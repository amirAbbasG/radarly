# Tool Reviews — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hash-generated fake reviews with a database-backed review system where authenticated users can write reviews and vote (like/dislike) on others' reviews.

**Architecture:** Two new Drizzle tables (`tool_reviews`, `review_votes`) with server actions for add/vote, a `ReviewDialog` modal + `ReviewSection` client component replacing the static review list in the community section. Optimistic UI updates match existing save/vote patterns.

**Tech Stack:** Drizzle ORM (PostgreSQL), Better Auth, shadcn/ui, motion/react, Tailwind CSS v4

## Global Constraints

- Follow existing codebase patterns: `crypto.randomUUID()` for IDs, camelCase JS properties with snake_case DB columns, `unique()` composite indexes matching `saved_tools`/`tool_votes`
- Auth checks use `auth.api.getSession({ headers: await headers() })` — no middleware
- Client optimistic updates use version-ref pattern from `handleSave`/`handleVote` in `tool-detail.tsx`
- Dialog follows `SearchDialog` pattern: `AnimatePresence` + `motion.div` backdrop + panel, body scroll lock, keyboard Escape to close
- No pagination — load all reviews
- No replies, no editing, no deletion

---

### Task 1: Schema — Add `tool_reviews` and `review_votes` tables

**Files:**

- Modify: `src/lib/db/schema.ts` (append two table definitions after `toolSubmissions`)

**Interfaces:**

- Produces: `toolReviews`, `reviewVotes` Drizzle table objects exported from schema

- [ ] **Step 1: Add table definitions**

Append after the `toolSubmissions` table definition (after line 146):

```ts
export const toolReviews = pgTable("tool_reviews", {
  id: text("id").primaryKey(),
  toolSlug: text("tool_slug")
    .notNull()
    .references(() => tools.slug, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewVotes = pgTable(
  "review_votes",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => toolReviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vote: integer("vote").notNull(), // 1 = like, -1 = dislike
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    uniqueVote: unique().on(table.reviewId, table.userId),
  }),
);
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```

Expected: creates a new migration SQL file in `drizzle/` directory.

- [ ] **Step 3: Run migration**

```bash
npx drizzle-kit migrate
```

Expected: "Migrations completed" or similar success message.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add tool_reviews and review_votes tables"
```

---

### Task 2: Data Layer — Add `ReviewData` type and `getToolReviews` query

**Files:**

- Modify: `src/lib/tools-data.ts` (add `ReviewData` type export)
- Modify: `src/lib/data.ts` (add `getToolReviews` function)

**Interfaces:**

- Produces: `ReviewData` type (imported by tasks 3, 5, 6)
- Produces: `getToolReviews(toolSlug, userId?)` function (imported by task 7)

- [ ] **Step 1: Add `ReviewData` type to `tools-data.ts`**

Insert after the `ToolDetail` type definition (after line 166):

```ts
export type ReviewData = {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote: number; // 1 = like, -1 = dislike, 0 = no vote
  user: { name: string; id: string };
};
```

- [ ] **Step 2: Add `getToolReviews` to `data.ts`**

Insert before `export { getToolDetail }` (before line 101):

```ts
import { eq, desc, and } from "drizzle-orm";
import { toolReviews, reviewVotes, user as userTable } from "@/lib/db/schema";
import type { ReviewData } from "@/lib/tools-data";

export async function getToolReviews(
  toolSlug: string,
  userId?: string,
): Promise<ReviewData[]> {
  const rows = await db
    .select({
      id: toolReviews.id,
      content: toolReviews.content,
      createdAt: toolReviews.createdAt,
      userName: userTable.name,
      userId: userTable.id,
      likes: sql<number>`cast(coalesce(sum(case when ${reviewVotes.vote} = 1 then 1 else 0 end), 0) as int)`,
      dislikes: sql<number>`cast(coalesce(sum(case when ${reviewVotes.vote} = -1 then 1 else 0 end), 0) as int)`,
      userVote: userId
        ? sql<number>`cast(coalesce(max(case when ${reviewVotes.userId} = ${userId} then ${reviewVotes.vote} else 0 end), 0) as int)`
        : sql<number>`0`,
    })
    .from(toolReviews)
    .leftJoin(userTable, eq(toolReviews.userId, userTable.id))
    .leftJoin(reviewVotes, eq(toolReviews.id, reviewVotes.reviewId))
    .where(eq(toolReviews.toolSlug, toolSlug))
    .groupBy(
      toolReviews.id,
      userTable.name,
      userTable.id,
      toolReviews.content,
      toolReviews.createdAt,
    )
    .orderBy(desc(toolReviews.createdAt));

  return rows.map(r => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    likes: r.likes,
    dislikes: r.dislikes,
    userVote: r.userVote,
    user: { name: r.userName, id: r.userId },
  }));
}
```

Note: needs `sql` import added to the `drizzle-orm` import line in `data.ts`:

```ts
import { eq, desc, sql, and } from "drizzle-orm";
```

- [ ] **Step 3: Verify query compiles**

```bash
npx tsc --noEmit
```

Expected: no new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/tools-data.ts src/lib/data.ts
git commit -m "feat: add ReviewData type and getToolReviews query"
```

---

### Task 3: Server Actions — Create `src/app/actions/reviews.ts`

**Files:**

- Create: `src/app/actions/reviews.ts`

**Interfaces:**

- Consumes: `toolReviews`, `reviewVotes` from `@/lib/db/schema` (Task 1)
- Consumes: `ReviewData` from `@/lib/tools-data` (Task 2)
- Produces: `addReview(toolSlug, content)` → `ReviewData`
- Produces: `voteReview(reviewId, reviewUserId, vote)` → `{ likes, dislikes, userVote }`

- [ ] **Step 1: Create actions file**

```ts
"use server";

import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toolReviews, reviewVotes } from "@/lib/db/schema";
import type { ReviewData } from "@/lib/tools-data";

export async function addReview(
  toolSlug: string,
  content: string,
): Promise<ReviewData> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const trimmed = content.trim();
  if (trimmed.length < 10)
    throw new Error("Review must be at least 10 characters");
  if (trimmed.length > 1000)
    throw new Error("Review must be at most 1000 characters");

  const id = crypto.randomUUID();
  await db.insert(toolReviews).values({
    id,
    toolSlug,
    userId: session.user.id,
    content: trimmed,
  });

  return {
    id,
    content: trimmed,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    userVote: 0,
    user: { name: session.user.name, id: session.user.id },
  };
}

export async function voteReview(
  reviewId: string,
  reviewUserId: string,
  vote: 1 | -1,
): Promise<{ likes: number; dislikes: number; userVote: number }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthenticated");

  if (session.user.id === reviewUserId) {
    throw new Error("Cannot vote on your own review");
  }

  const existing = await db
    .select({ id: reviewVotes.id, vote: reviewVotes.vote })
    .from(reviewVotes)
    .where(
      and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.userId, session.user.id),
      ),
    )
    .limit(1);

  let newUserVote: number;

  if (existing.length > 0) {
    if (existing[0].vote === vote) {
      await db.delete(reviewVotes).where(eq(reviewVotes.id, existing[0].id));
      newUserVote = 0;
    } else {
      await db
        .update(reviewVotes)
        .set({ vote })
        .where(eq(reviewVotes.id, existing[0].id));
      newUserVote = vote;
    }
  } else {
    await db.insert(reviewVotes).values({
      id: crypto.randomUUID(),
      reviewId,
      userId: session.user.id,
      vote,
    });
    newUserVote = vote;
  }

  const [counts] = await db
    .select({
      likes: sql<number>`cast(coalesce(sum(case when ${reviewVotes.vote} = 1 then 1 else 0 end), 0) as int)`,
      dislikes: sql<number>`cast(coalesce(sum(case when ${reviewVotes.vote} = -1 then 1 else 0 end), 0) as int)`,
    })
    .from(reviewVotes)
    .where(eq(reviewVotes.reviewId, reviewId));

  return {
    likes: counts.likes,
    dislikes: counts.dislikes,
    userVote: newUserVote,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/reviews.ts
git commit -m "feat: add review server actions"
```

---

### Task 4: Clean Up — Remove fake review data from `tools-data.ts`

**Files:**

- Modify: `src/lib/tools-data.ts` (export `timeAgo`, remove `reviews` from `ToolDetail`, remove `REVIEWERS`, remove review generation from `getToolDetail`)

**Interfaces:**

- Consumes: None
- Produces: Cleaner `ToolDetail` type, exported `timeAgo` (consumed by Task 6)

- [ ] **Step 0: Export `timeAgo`**

Change `function timeAgo` to `export function timeAgo` (line 168).

- [ ] **Step 1: Remove `reviews` from `ToolDetail` type**

In the `ToolDetail` type, delete the line:

```ts
reviews: {
  author: string;
  role: string;
  text: string;
  up: number;
}
[];
```

- [ ] **Step 2: Remove `REVIEWERS` constant**

Delete lines:

```ts
const REVIEWERS = [
  { author: "Alex Rivera", role: "Senior Engineer" },
  { author: "Priya Nair", role: "Product Designer" },
  { author: "Jordan Kim", role: "Indie Hacker" },
  { author: "Sam Okafor", role: "Startup CTO" },
];
```

- [ ] **Step 3: Remove review generation from `getToolDetail` return object**

Delete the `reviews: [...]` entry from the return object (the 12-line block with two review objects).

- [ ] **Step 4: Verify no dead imports or references**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tools-data.ts
git commit -m "refactor: remove fake review data from ToolDetail"
```

---

### Task 5: ReviewDialog — Create add-review modal

**Files:**

- Create: `src/features/tool-detail/review-dialog.tsx`

**Interfaces:**

- Consumes: `addReview` from `@/app/actions/reviews` (Task 3)
- Consumes: `ReviewData` from `@/lib/tools-data` (Task 2)
- Produces: `<ReviewDialog open onOpenChange toolSlug onSubmitted />`

- [ ] **Step 1: Create `review-dialog.tsx`**

```tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { addReview } from "@/app/actions/reviews";
import type { ReviewData } from "@/lib/tools-data";

export function ReviewDialog({
  open,
  onOpenChange,
  toolSlug,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  onSubmitted: (review: ReviewData) => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setError("");
      setSubmitting(false);
      const id = requestAnimationFrame(() => textareaRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (trimmed.length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Review must be at most 1000 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const review = await addReview(toolSlug, trimmed);
      onSubmitted(review);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onOpenChange(false);
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onKeyDown={onKeyDown}
        >
          <button
            type="button"
            aria-label="Close review dialog"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Write a review
              </h2>
              <button
                type="button"
                aria-label="Close review dialog"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience with this tool..."
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-secondary/50 focus:ring-1 focus:ring-secondary/30"
              />

              <div className="mt-2 flex items-center justify-between text-xs">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {content.length}/1000
                  </span>
                )}
                <span className="text-muted-foreground">
                  Ctrl+Enter to submit
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || content.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-transform hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? "Posting..." : "Post review"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/tool-detail/review-dialog.tsx
git commit -m "feat: add ReviewDialog component"
```

---

### Task 6: ReviewSection — Build review list with optimistic voting

**Files:**

- Create: `src/features/tool-detail/review-section.tsx`
- Modify: `src/lib/utils.ts` (add `initials` helper)

**Interfaces:**

- Consumes: `ReviewData` from `@/lib/tools-data` (Task 2)
- Consumes: `voteReview` from `@/app/actions/reviews` (Task 3)
- Consumes: `ReviewDialog` from `./review-dialog` (Task 5)
- Produces: `<ReviewSection toolSlug initialReviews isAuthenticated voted voteCount onToolVote />`

- [ ] **Step 1: Add `initials` helper to `lib/utils.ts`**

Append to `src/lib/utils.ts`:

```ts
export function initials(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
```

- [ ] **Step 2: Create `review-section.tsx`**

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import Link from "next/link";
import { voteReview } from "@/app/actions/reviews";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/lib/tools-data";
import { ReviewDialog } from "./review-dialog";
import type { ReviewData } from "@/lib/tools-data";

function ReviewCard({
  review,
  isAuthenticated,
}: {
  review: ReviewData;
  isAuthenticated: boolean;
}) {
  const [likes, setLikes] = useState(review.likes);
  const [dislikes, setDislikes] = useState(review.dislikes);
  const [userVote, setUserVote] = useState(review.userVote);
  const voteVersionRef = useRef(0);

  const handleVote = useCallback(
    async (vote: 1 | -1) => {
      if (!isAuthenticated) return;

      const prevVote = userVote;
      const prevLikes = likes;
      const prevDislikes = dislikes;

      let nextVote: number;
      let nextLikes = likes;
      let nextDislikes = dislikes;

      if (prevVote === vote) {
        nextVote = 0;
        if (vote === 1) nextLikes = likes - 1;
        else nextDislikes = dislikes - 1;
      } else {
        if (prevVote === 1) nextLikes = likes - 1;
        else if (prevVote === -1) nextDislikes = dislikes - 1;

        nextVote = vote;
        if (vote === 1) nextLikes = likes + 1;
        else nextDislikes = dislikes + 1;
      }

      setUserVote(nextVote);
      setLikes(nextLikes);
      setDislikes(nextDislikes);

      const version = ++voteVersionRef.current;
      try {
        const result = await voteReview(review.id, review.user.id, vote);
        if (version === voteVersionRef.current) {
          setLikes(result.likes);
          setDislikes(result.dislikes);
          setUserVote(result.userVote);
        }
      } catch {
        if (version === voteVersionRef.current) {
          setLikes(prevLikes);
          setDislikes(prevDislikes);
          setUserVote(prevVote);
        }
      }
    },
    [userVote, likes, dislikes, review.id, review.user.id, isAuthenticated],
  );

  const createdAt = Date.parse(review.createdAt);
  const relativeTime = isNaN(createdAt)
    ? ""
    : timeAgo(new Date(createdAt).toISOString());

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-xs font-bold text-foreground ring-1 ring-inset ring-border">
          {initials(review.user.name)}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">
            {review.user.name}
          </div>
          <div className="text-xs text-muted-foreground">{relativeTime}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
        {review.content}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleVote(1)}
          disabled={!isAuthenticated}
          className={
            "inline-flex items-center gap-1.5 text-xs font-medium transition-colors " +
            (userVote === 1
              ? "text-secondary"
              : "text-muted-foreground hover:text-foreground") +
            (!isAuthenticated ? " opacity-50 cursor-not-allowed" : "")
          }
        >
          <ThumbsUp
            className={"size-3.5 " + (userVote === 1 ? "fill-current" : "")}
          />
          {likes}
        </button>

        <button
          type="button"
          onClick={() => handleVote(-1)}
          disabled={!isAuthenticated}
          className={
            "inline-flex items-center gap-1.5 text-xs font-medium transition-colors " +
            (userVote === -1
              ? "text-destructive"
              : "text-muted-foreground hover:text-foreground") +
            (!isAuthenticated ? " opacity-50 cursor-not-allowed" : "")
          }
        >
          <ThumbsDown
            className={"size-3.5 " + (userVote === -1 ? "fill-current" : "")}
          />
          {dislikes}
        </button>
      </div>
    </div>
  );
}

export function ReviewSection({
  toolSlug,
  initialReviews,
  isAuthenticated,
  voted,
  voteCount,
  onToolVote,
}: {
  toolSlug: string;
  initialReviews: ReviewData[];
  isAuthenticated: boolean;
  voted: boolean;
  voteCount: number;
  onToolVote: () => void;
}) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSubmitted(review: ReviewData) {
    setReviews(prev => [review, ...prev]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Community
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToolVote}
            aria-pressed={voted}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (voted
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            <ThumbsUp className={"size-4 " + (voted ? "fill-current" : "")} />
            Useful
            <span className="tabular-nums">{voteCount}</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-secondary/50"
            >
              <MessageSquare className="size-4" />
              Write a review
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-secondary/50"
            >
              <MessageSquare className="size-4" />
              Sign in to review
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to share your experience.
          </p>
        )}
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <ReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toolSlug={toolSlug}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/tool-detail/review-section.tsx src/lib/utils.ts
git commit -m "feat: add ReviewSection component with optimistic voting"
```

---

### Task 7: Wire Everything — Update `ToolDetail` and page

**Files:**

- Modify: `src/features/tool-detail/tool-detail.tsx` (replace static review block with `ReviewSection`, remove local `initials`)
- Modify: `src/app/tools/[slug]/page.tsx` (fetch reviews + session, pass to `ToolDetail`)

**Interfaces:**

- Consumes: `ReviewSection` from `./review-section` (Task 6)
- Consumes: `ReviewData` from `@/lib/tools-data` (Task 2)
- Consumes: `getToolReviews` from `@/lib/data` (Task 2)
- Consumes: `auth` from `@/lib/auth`

- [ ] **Step 1: Update `page.tsx`**

Add imports:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getToolReviews } from "@/lib/data";
import type { ReviewData } from "@/lib/tools-data";
```

In the `ToolPage` component, before the `Promise.all`, add:

```ts
const session = await auth.api.getSession({ headers: await headers() });
const userId = session?.user?.id;
```

Add `getToolReviews` to the `Promise.all`:

```ts
const [detail, related, allTools, interactionState, reviews] =
  await Promise.all([
    Promise.resolve(getToolDetail(tool)),
    getRelatedTools(tool, 3),
    getAllTools(),
    getToolInteractionState(slug),
    getToolReviews(slug, userId),
  ]);
```

Pass new props to `ToolDetail`:

```tsx
<ToolDetail
  tool={tool}
  detail={detail}
  related={related}
  rank={rank}
  interactionState={interactionState}
  reviews={reviews}
  isAuthenticated={Boolean(userId)}
/>
```

- [ ] **Step 2: Update `tool-detail.tsx`**

Add imports at the top:

```tsx
import { ReviewSection } from "./review-section";
import type { ReviewData } from "@/lib/tools-data";
```

Remove import of `ThumbsUp` from `lucide-react` (line 17) — it's now only used in `ReviewSection`.

Remove unused imports: `MessageSquare` was never imported here. `ThumbsUp` was used in the community vote button which moved to `ReviewSection`. Check: `ThumbsUp` is also NOT used elsewhere in `tool-detail.tsx` after the community section is removed. Let me verify...

The `ThumbsUp` import is on line 17. Searching the file for usage:

- Line 17: import
- Line 524: inside the community vote button — this is being removed
- Line 551: inside the fake review card up-count — this is being removed

So `ThumbsUp` is no longer needed. Also, `initials` function (lines 32-40) is no longer used (it was only used in the fake review cards). Remove it.

Add new props to `ToolDetail`:

```tsx
export function ToolDetail({
  tool,
  detail,
  related,
  rank,
  interactionState,
  reviews,
  isAuthenticated,
}: {
  tool: Tool;
  detail: ToolDetailData;
  related: Tool[];
  rank: number;
  interactionState: { saved: boolean; voted: boolean; voteCount: number };
  reviews: ReviewData[];
  isAuthenticated: boolean;
}) {
```

Replace the entire community section (the `<Section>` with `id="community"` from line 504 to line 562) with:

```tsx
{
  /* community */
}
<Section>
  <div id="community" className="scroll-mt-32">
    <ReviewSection
      toolSlug={tool.slug}
      initialReviews={reviews}
      isAuthenticated={isAuthenticated}
      voted={voted}
      voteCount={voteCount}
      onToolVote={handleVote}
    />
  </div>
</Section>;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any unused import warnings.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: successful build. Check for any import or type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/tool-detail/tool-detail.tsx src/app/tools/\[slug\]/page.tsx
git commit -m "feat: wire ReviewSection into ToolDetail page"
```

---

### Final Verification

After all tasks complete:

- [ ] **Run full build:**

```bash
npm run build
```

- [ ] **Manual smoke test checklist:**
  1. Visit a tool detail page — reviews section shows (may be empty)
  2. Sign in — "Write a review" button appears
  3. Click "Write a review" — dialog opens, Escape closes it
  4. Submit a review — appears at top of list immediately
  5. Click like/dislike on a review — count updates instantly
  6. Click same vote again — toggles off
  7. Switch from like to dislike — counts update correctly
  8. Sign out — vote buttons show as disabled, "Sign in to review" link appears
  9. Refresh — all changes persist from DB
