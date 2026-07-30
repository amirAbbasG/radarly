"use server";

import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedTools, toolVotes } from "@/lib/db/schema";

export async function toggleSave(slug: string): Promise<{ saved: boolean }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { saved: false };

  const existing = await db
    .select({ id: savedTools.id })
    .from(savedTools)
    .where(
      and(
        eq(savedTools.userId, session.user.id),
        eq(savedTools.toolSlug, slug),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(savedTools).where(eq(savedTools.id, existing[0].id));
    return { saved: false };
  }

  await db.insert(savedTools).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    toolSlug: slug,
  });
  return { saved: true };
}

export async function castVote(
  slug: string,
): Promise<{ voted: boolean; count: number }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { voted: false, count: 0 };

  const existing = await db
    .select({ id: toolVotes.id })
    .from(toolVotes)
    .where(
      and(eq(toolVotes.userId, session.user.id), eq(toolVotes.toolSlug, slug)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(toolVotes).where(eq(toolVotes.id, existing[0].id));
  } else {
    await db.insert(toolVotes).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      toolSlug: slug,
    });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(toolVotes)
    .where(eq(toolVotes.toolSlug, slug));

  return { voted: existing.length === 0, count };
}

export async function getToolInteractionState(slug: string): Promise<{
  saved: boolean;
  voted: boolean;
  voteCount: number;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const [savedRow, votedRow, countRow] = await Promise.all([
      userId
        ? db
            .select({ id: savedTools.id })
            .from(savedTools)
            .where(
              and(eq(savedTools.userId, userId), eq(savedTools.toolSlug, slug)),
            )
            .limit(1)
        : Promise.resolve([]),
      userId
        ? db
            .select({ id: toolVotes.id })
            .from(toolVotes)
            .where(
              and(eq(toolVotes.userId, userId), eq(toolVotes.toolSlug, slug)),
            )
            .limit(1)
        : Promise.resolve([]),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(toolVotes)
        .where(eq(toolVotes.toolSlug, slug)),
    ]);

    return {
      saved: savedRow.length > 0,
      voted: votedRow.length > 0,
      voteCount: countRow[0]?.count ?? 0,
    };
  } catch {
    return { saved: false, voted: false, voteCount: 0 };
  }
}
