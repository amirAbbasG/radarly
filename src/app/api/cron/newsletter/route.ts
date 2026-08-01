import { desc, eq, isNull } from "drizzle-orm";
import { Resend } from "resend";
import webpush from "web-push";
import { db } from "@/lib/db";
import {
  tools,
  newsletterSubscribers,
  pushSubscriptions,
} from "@/lib/db/schema";
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

  let pushSent = 0;
  let pushFailed = 0;

  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:hello@radarly.ai",
      process.env.NEXT_PUBLIC_VAPID_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const subs = await db.select().from(pushSubscriptions);
    const pushTitle = "The Sunday Signal";
    const pushBody = topToolNames(toolRows);

    for (const sub of subs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(
          pushSub,
          JSON.stringify({
            title: pushTitle,
            body: pushBody,
            url: `${baseUrl}`,
          }),
        );
        pushSent++;
      } catch (err) {
        if (
          err instanceof webpush.WebPushError &&
          (err.statusCode === 410 || err.statusCode === 404)
        ) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
        pushFailed++;
        console.error("push send failed", sub.endpoint, err);
      }
    }
  }

  return Response.json({
    ok: true,
    sent,
    failed: failures.length,
    pushSent,
    pushFailed,
  });
}

function topToolNames(rows: (typeof tools.$inferSelect)[]) {
  return rows
    .slice(0, 3)
    .map(t => t.name)
    .join(", ");
}
