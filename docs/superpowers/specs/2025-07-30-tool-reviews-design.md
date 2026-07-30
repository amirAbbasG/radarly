# Tool Reviews — Design Spec

**Date:** 2025-07-30
**Status:** Approved

## Overview

Replace hash-generated fake reviews in `getToolDetail()` with a real database-backed review system. Authenticated users can write reviews and vote (like/dislike) on others' reviews. No replies or nesting.

## Decisions

| Decision              | Choice                                           |
| --------------------- | ------------------------------------------------ |
| Reviewer identity     | Better Auth profile name (not anonymous)         |
| Vote model            | Thumbs up + thumbs down, bidirectional toggle    |
| Add dialog            | Centered modal matching `SearchDialog` pattern   |
| Pagination            | Load all reviews, no pagination                  |
| Provider default data | None — ingestion sources don't carry review data |

## Database Schema

Add to `src/lib/db/schema.ts`:

### `tool_reviews`

| Column       | Type                   | Notes                             |
| ------------ | ---------------------- | --------------------------------- |
| `id`         | `text` PK              | `crypto.randomUUID()`             |
| `tool_slug`  | `text` NOT NULL        | FK → `tools.slug`, CASCADE delete |
| `user_id`    | `text` NOT NULL        | FK → `user.id`, CASCADE delete    |
| `content`    | `text` NOT NULL        | Trimmed, 10-1000 chars validated  |
| `created_at` | `timestamptz` NOT NULL | `defaultNow()`                    |

### `review_votes`

| Column       | Type                   | Notes                                  |
| ------------ | ---------------------- | -------------------------------------- |
| `id`         | `text` PK              | `crypto.randomUUID()`                  |
| `review_id`  | `text` NOT NULL        | FK → `tool_reviews.id`, CASCADE delete |
| `user_id`    | `text` NOT NULL        | FK → `user.id`, CASCADE delete         |
| `vote`       | `integer` NOT NULL     | 1 = like, -1 = dislike                 |
| `created_at` | `timestamptz` NOT NULL | `defaultNow()`                         |

Unique index: `(review_id, user_id)` — one vote per user per review.

## Data Layer

### `src/lib/data.ts` additions

```ts
export type ReviewData = {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote: number; // 1, -1, or 0 (0 = no vote / unauthenticated)
  user: { name: string };
};

export async function getToolReviews(toolSlug: string): Promise<ReviewData[]>;
```

- Joins `tool_reviews` ↔ `user` for name
- If session exists: left joins `review_votes` for current user's vote per review
- Subquery aggregates: `SELECT SUM(CASE WHEN vote=1 THEN 1 ELSE 0 END) as likes, SUM(CASE WHEN vote=-1 THEN 1 ELSE 0 END) as dislikes FROM review_votes WHERE review_id = tr.id`
- Orders by `created_at DESC`

### Server Actions (`src/app/actions/reviews.ts`)

#### `addReview(toolSlug: string, content: string): Promise<ReviewData>`

1. Get session via `auth.api.getSession()`
2. If no session → throw `"Unauthenticated"`
3. Validate: content trimmed, 10–1000 chars
4. Insert `tool_reviews` row (`crypto.randomUUID()` for id)
5. Return review with `{ likes: 0, dislikes: 0, userVote: 0, user: { name } }`

#### `voteReview(reviewId: string, reviewUserId: string, vote: 1 | -1): Promise<{ likes: number, dislikes: number, userVote: number }>`

1. Get session → throw if no session
2. If `session.user.id === reviewUserId` → throw `"Cannot vote on own review"`
3. Check if existing vote row exists for `(reviewId, userId)`
4. If existing vote same as new vote → DELETE (toggle off), `newUserVote = 0`
5. If existing vote different → UPDATE to new vote, `newUserVote = vote`
6. If no existing vote → INSERT, `newUserVote = vote`
7. Re-query aggregate counts for `likes`, `dislikes`
8. Return `{ likes, dislikes, userVote: newUserVote }`

## UI Components

### `ReviewSection` (`src/features/tool-detail/review-section.tsx`)

Client component. Props:

- `toolSlug: string`
- `initialReviews: ReviewData[]`
- `isAuthenticated: boolean`

State:

- `reviews: ReviewData[]` (seeded from `initialReviews`)
- Optimistic add/vote using version-ref pattern (same as `handleSave`/`handleVote`)

Renders:

- Header row: "Community" title + "Write a review" button (or "Sign in to review" link if unauthenticated)
- List of `ReviewCard` components
- Empty state: "No reviews yet. Be the first."

### `ReviewDialog` (`src/features/tool-detail/review-dialog.tsx`)

Client component. Props:

- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `toolSlug: string`
- `onSubmit: (review: ReviewData) => void`

Structure (follows `SearchDialog`):

- `AnimatePresence` + `motion.div` backdrop: `bg-black/50 backdrop-blur-sm z-50 fixed inset-0`
- `motion.div` panel: `rounded-2xl border border-border bg-card p-6 max-w-lg w-full mx-auto`
- Title: "Write a review"
- Textarea: auto-focused, placeholder "Share your experience with this tool..."
- Char count: "123/1000"
- Footer: Cancel button + "Post review" button (disabled when content < 10 chars)
- Keyboard: Escape closes, Ctrl+Enter submits
- Body scroll lock via `useEffect` + `document.body.style.overflow`

Submits via `addReview` server action. On success: calls `onSubmit(review)` to add to list, closes dialog.

### `ReviewCard` (inline in `review-section.tsx`)

Renders single review:

- Avatar circle with initials (reuses `initials()` helper from `tool-detail.tsx`)
- Author name + relative time (`timeAgo` from `tools-data.ts`)
- Content text
- Like/dislike row:
  - ThumbsUp icon + count, highlighted when `userVote === 1`
  - ThumbsDown icon + count, highlighted when `userVote === -1`
  - Click toggles vote (disabled when unauthenticated or own review)
  - Optimistic: counts update instantly, revert on error

### Integration in `ToolDetail`

1. Server component page fetches `getToolReviews(toolSlug)` and session
2. Passes `initialReviews` + `isAuthenticated` to `ReviewSection`
3. `ReviewSection` replaces the static `<figure>` loop in `#community` section (lines 532–559)
4. Remove `reviews` field from `ToolDetail` type in `tools-data.ts`
5. Remove `REVIEWERS` array and review generation from `getToolDetail()`

## Migration

Run `drizzle-kit generate` + `drizzle-kit migrate` after adding schema.

## Error Handling

- Server actions throw on auth failure → client catches and reverts optimistic state
- Content validation fails → throw with message, dialog shows inline error
- Network failure → revert optimistic state, no toast (same pattern as existing interactions)

## Testing

- Unit: `voteReview` toggle logic (insert → toggle off → switch vote)
- Integration: `addReview` creates row, `getToolReviews` returns it
- Manual: dialog open/close, keyboard navigation, optimistic UI rollback

## Out of Scope

- Reply threading
- Review editing or deletion
- Rich text / markdown in reviews
- Admin moderation
- Email notifications
