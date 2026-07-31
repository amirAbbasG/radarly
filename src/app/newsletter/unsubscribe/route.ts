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
