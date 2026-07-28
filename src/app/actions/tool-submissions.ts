"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toolSubmissions } from "@/lib/db/schema";

export type SubmissionState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

const CATEGORIES = new Set([
  "AI assistants",
  "Developer tools",
  "Design & creative",
  "Marketing & sales",
  "Productivity",
  "Research & data",
  "Other",
]);

function normalizeUrl(value: string) {
  const raw = value.trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Invalid protocol");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
}

export async function submitTool(
  _previous: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const values = {
    toolName: String(formData.get("toolName") ?? "").trim(),
    canonicalUrl: String(formData.get("canonicalUrl") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    submitterEmail: String(formData.get("submitterEmail") ?? "")
      .trim()
      .toLowerCase(),
    evidenceUrl: String(formData.get("evidenceUrl") ?? "").trim(),
  };
  const errors: Record<string, string> = {};

  if (values.toolName.length < 2 || values.toolName.length > 80)
    errors.toolName = "Use 2–80 characters.";
  if (!CATEGORIES.has(values.category)) errors.category = "Choose a category.";
  if (values.description.length < 40 || values.description.length > 500)
    errors.description = "Write 40–500 characters.";
  if (!/^\S+@\S+\.\S+$/.test(values.submitterEmail))
    errors.submitterEmail = "Enter a valid email.";

  let canonicalUrl = "";
  let evidenceUrl: string | null = null;
  try {
    canonicalUrl = normalizeUrl(values.canonicalUrl);
  } catch {
    errors.canonicalUrl = "Enter a valid website URL.";
  }
  if (values.evidenceUrl) {
    try {
      evidenceUrl = normalizeUrl(values.evidenceUrl);
    } catch {
      errors.evidenceUrl = "Enter a valid evidence URL.";
    }
  }
  if (Object.keys(errors).length) return { success: false, errors };

  try {
    const duplicate = await db
      .select({ id: toolSubmissions.id })
      .from(toolSubmissions)
      .where(
        and(
          eq(toolSubmissions.canonicalUrl, canonicalUrl),
          eq(toolSubmissions.status, "pending"),
        ),
      )
      .limit(1);
    if (duplicate.length)
      return {
        success: false,
        errors: { canonicalUrl: "This tool is already in our review queue." },
      };

    const session = await auth.api.getSession({ headers: await headers() });
    await db.insert(toolSubmissions).values({
      id: crypto.randomUUID(),
      userId: session?.user?.id ?? null,
      toolName: values.toolName,
      canonicalUrl,
      category: values.category,
      description: values.description,
      submitterEmail: values.submitterEmail,
      evidenceUrl,
    });
    return { success: true, message: "Your tool is now on our radar." };
  } catch {
    return {
      success: false,
      message: "We could not save your submission. Please try again.",
    };
  }
}
