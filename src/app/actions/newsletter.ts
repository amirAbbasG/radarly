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
