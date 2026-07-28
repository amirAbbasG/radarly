import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthPage } from "@/features/auth/auth-page"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Create account — Radarly",
  description: "Create a Radarly account and start tracking the AI tools gaining real momentum.",
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return <AuthPage mode="sign-up" />
}
