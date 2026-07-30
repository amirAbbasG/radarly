"use server";

import { eq, desc, sql, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { rowToTool } from "@/lib/data";
import type { Tool } from "@/lib/tools-data";

export async function searchTools(query: string): Promise<Tool[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const rows = await db
      .select()
      .from(tools)
      .where(
        and(
          eq(tools.status, "published"),
          or(
            sql`similarity(${tools.name}, ${q}) > 0.1`,
            sql`similarity(${tools.hook}, ${q}) > 0.1`,
            sql`similarity(${tools.description}, ${q}) > 0.1`,
          ),
        ),
      )
      .orderBy(
        desc(
          sql`greatest(
            similarity(${tools.name}, ${q}),
            similarity(${tools.hook}, ${q}),
            similarity(${tools.description}, ${q})
          )`,
        ),
        desc(tools.trendingScore),
      )
      .limit(20);

    return rows.map(rowToTool);
  } catch {
    return [];
  }
}
