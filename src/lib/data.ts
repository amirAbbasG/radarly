import "server-only";

import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tools,
  toolReviews,
  reviewVotes,
  user as userTable,
} from "@/lib/db/schema";
import { sourceLabel } from "@/lib/ingest-utils";
import type {
  Tool,
  ToolDetail,
  CategoryProfile,
  ReviewData,
} from "@/lib/tools-data";
import { CATEGORY_PROFILES } from "@/lib/tools-data";

export function rowToTool(row: typeof tools.$inferSelect): Tool {
  const history =
    (row.momentumHistory as { date: string; score: number }[]) ?? [];
  return {
    name: row.name,
    slug: row.slug,
    hook: row.hook ?? "",
    logo: row.logo ?? undefined,
    website: row.website ?? undefined,
    cat: row.category ?? "coding",
    score: row.trendingScore ?? 0,
    sig: (row.signal as Tool["sig"]) ?? "steady",
    spark: history.slice(-12).map(e => e.score),
    source: sourceLabel(row.sourcePlatform),
    description: row.description ?? undefined,
    lastUpdatedAt: row.lastUpdatedAt?.toISOString(),
  };
}

export async function getAllTools(): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

export async function getCategoryTools(category: string): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, category))
    .orderBy(desc(tools.trendingScore));
  return rows.map(rowToTool);
}

export async function getRelatedTools(tool: Tool, limit = 3): Promise<Tool[]> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.category, tool.cat))
    .limit(limit + 1);
  return rows
    .filter(r => r.name !== tool.name)
    .slice(0, limit)
    .map(rowToTool);
}

export async function getCategoryProfiles(): Promise<CategoryProfile[]> {
  const rows = await db
    .select({
      category: tools.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(tools)
    .where(eq(tools.status, "published"))
    .groupBy(tools.category);

  const countMap = new Map<string, number>();
  for (const r of rows) {
    if (r.category) countMap.set(r.category, r.count);
  }

  return CATEGORY_PROFILES.map(profile => ({
    ...profile,
    count: countMap.get(profile.toolCategory) ?? 0,
  }));
}

export async function getToolOfWeek(): Promise<Tool | null> {
  const rows = await db
    .select()
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.trendingScore))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToTool(rows[0]);
}

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
    user: { name: r.userName ?? "", id: r.userId ?? "" },
  }));
}

export { getToolDetail } from "@/lib/tools-data";
