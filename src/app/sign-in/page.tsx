import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthPage } from "@/features/auth/auth-page"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign in — Radarly",
  description: "Sign in to your Radarly account to access saved AI tools and your personalized radar.",
}

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return <AuthPage mode="sign-in" />
}
