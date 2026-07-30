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
