"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Mode = "sign-in" | "sign-up";

const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-secondary",
  "bg-success",
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSocialSignIn(provider: "github" | "google") {
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });

    if (error) {
      setLoading(false);
      setError(
        error.message ??
          `${provider === "github" ? "GitHub" : "Google"} sign-in is not configured yet.`,
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({
          email,
          password,
          rememberMe: remember,
        });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      {/* Header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col gap-2"
        >
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="leading-relaxed text-muted-foreground">
            {isSignUp
              ? "Start tracking what's rising in AI"
              : "Sign in to pick up your saved tools and personalized feed."}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading}
            onClick={() => handleSocialSignIn("github")}
            className="h-11"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://thesvg.org/icons/github/default.svg"
              alt=""
              aria-hidden="true"
              className="size-4 dark:invert"
            />
            GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading}
            onClick={() => handleSocialSignIn("google")}
            className="h-11"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://thesvg.org/icons/google/color.svg"
              alt=""
              aria-hidden="true"
              className="size-4"
            />
            Google
          </Button>
        </div>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            or continue with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {isSignUp && (
            <motion.div
              key="name-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Field label="Full name" htmlFor="name" icon={User}>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isSignUp}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="h-11 pl-10"
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Email" htmlFor="email" icon={Mail}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 pl-10"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          icon={Lock}
          action={
            !isSignUp ? (
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            ) : null
          }
        >
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={
              isSignUp ? "At least 8 characters" : "Enter your password"
            }
            className="h-11 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </Field>

        {/* Password strength — sign up only */}
        <AnimatePresence initial={false}>
          {isSignUp && password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <span
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          i < strength.score
                            ? STRENGTH_COLORS[strength.score]
                            : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Requirement met={strength.checks.length}>
                    8+ characters
                  </Requirement>
                  <Requirement
                    met={strength.checks.upper && strength.checks.lower}
                  >
                    Upper & lower case
                  </Requirement>
                  <Requirement met={strength.checks.number}>
                    A number
                  </Requirement>
                  <Requirement met={strength.checks.symbol}>
                    A symbol
                  </Requirement>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remember me — sign in only */}
        {!isSignUp && (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={() => setRemember(v => !v)}
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded border transition-colors",
                remember
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-input",
              )}
            >
              {remember && <Check className="h-3 w-3" />}
            </button>
            Keep me signed in
          </label>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="group h-11 w-full bg-secondary text-base text-secondary-foreground hover:bg-secondary/90"
        >
          {loading ? (
            <>
              <Spinner className="text-secondary-foreground" />
              Please wait
            </>
          ) : (
            <>
              {isSignUp ? "Create account" : "Sign in"}
              <ArrowRight
                data-icon="inline-end"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>

        {isSignUp && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to Radarly? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-semibold text-foreground underline-offset-4 transition-colors hover:text-secondary hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

function Requirement({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs transition-colors",
        met ? "text-success" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "inline-flex h-3 w-3 items-center justify-center rounded-full border transition-colors",
          met ? "border-success bg-success/15" : "border-border",
        )}
      >
        {met && <Check className="h-2 w-2" />}
      </span>
      {children}
    </span>
  );
}
