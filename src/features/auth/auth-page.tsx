import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { AuthForm } from "@/features/auth/auth-form"
import { AuthShowcase } from "@/features/auth/auth-showcase"
import { Logo } from "@/components/common/logo"

type Mode = "sign-in" | "sign-up"

export function AuthPage({ mode }: { mode: Mode }) {
  return (
    <main className="min-h-svh bg-background p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-7xl grid-cols-1 gap-6 sm:min-h-[calc(100svh-2.5rem)] lg:min-h-[calc(100svh-3rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <AuthShowcase />

        <section className="relative flex min-h-[calc(100svh-1.5rem)] flex-col rounded-3xl bg-card px-5 py-5 ring-1 ring-foreground/10 sm:min-h-[calc(100svh-2.5rem)] sm:px-10 sm:py-7 lg:min-h-0 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link
              href="/public"
              className="ml-auto inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to radar
            </Link>
          </div>

          <div className="flex flex-1 items-center py-12 sm:py-16 lg:py-10">
            <AuthForm mode={mode} />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            Encrypted sessions. We never sell your data.
          </div>
        </section>
      </div>
    </main>
  )
}
