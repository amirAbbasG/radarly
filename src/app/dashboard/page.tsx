import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Mail, Radar, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function getInitials(name?: string | null, email?: string | null) {
  return name
    ? name
        .split(/\s+/)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (email?.slice(0, 2).toUpperCase() ?? "RA");
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { user } = session;
  const joinedAt = user.createdAt
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
        new Date(user.createdAt),
      )
    : "Recently";

  return (
    <>
      <Navbar showLinks={false} />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            Your radar
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            Welcome back, {user.name?.split(" ")[0] || "explorer"}.
          </h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Manage your Radarly account and keep your AI discovery setup ready
            for what is rising next.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your account identity and membership details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  {user.image && (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Account avatar"}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg font-semibold text-foreground">
                    {user.name || "Radarly member"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <Separator />
              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail
                    className="mt-0.5 size-5 text-secondary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </dt>
                    <dd className="mt-1 break-all text-sm font-medium text-foreground">
                      {user.email}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 size-5 text-secondary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Member since
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {joinedAt}
                    </dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account status</CardTitle>
              <CardDescription>Your Radarly access is active.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    className="size-5 text-secondary"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    Secure session
                  </span>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Radar className="size-5 text-secondary" aria-hidden="true" />
                  <span className="font-medium text-foreground">
                    Radar access
                  </span>
                </div>
                <Badge variant="secondary">Member</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card id="settings" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Essential settings</CardTitle>
            <CardDescription>
              Appearance controls are available from the theme button in the
              navigation. More personalized radar controls are coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
              <p className="font-medium text-foreground">
                Personalized signals
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Saved tools, category preferences, and custom alert frequencies
                will appear here as Radarly expands.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
