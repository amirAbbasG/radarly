"use server";

import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

export type ContactState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function sendContactMessage(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    subject: String(formData.get("subject") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
  const errors: Record<string, string> = {};

  if (values.name.length < 2) errors.name = "Tell us your name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email))
    errors.email = "Enter a valid email.";
  if (!values.subject) errors.subject = "Choose a subject.";
  if (values.message.length < 10)
    errors.message = "Write at least 10 characters.";

  if (Object.keys(errors).length) return { success: false, errors };

  try {
    await db.insert(contactMessages).values({
      id: crypto.randomUUID(),
      name: values.name,
      email: values.email,
      subject: values.subject,
      message: values.message,
    });
    return {
      success: true,
      message: "Message sent — we'll get back to you soon.",
    };
  } catch {
    return {
      success: false,
      message: "Could not send your message. Please try again.",
    };
  }
}
