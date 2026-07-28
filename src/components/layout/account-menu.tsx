"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(/\s+/)
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "RA";
}

export function AccountMenu({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    await authClient.signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (isPending) {
    return (
      <div
        className={
          mobile
            ? "flex justify-center py-3"
            : "hidden size-9 items-center justify-center md:flex"
        }
      >
        <Spinner className="text-muted-foreground" />
        <span className="sr-only">Loading account</span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/sign-up"
        onClick={onNavigate}
        className={
          mobile
            ? "rounded-lg bg-secondary px-4 py-3 text-center text-sm font-semibold text-secondary-foreground"
            : "hidden rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-transform hover:brightness-110 active:scale-95 md:inline-flex"
        }
      >
        Get started
      </Link>
    );
  }

  const { user } = session;

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
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
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name || "Radarly member"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <LayoutDashboard />
          Dashboard
        </Link>
        <Link
          href="/dashboard#settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Settings />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        render={
          <button
            type="button"
            className="hidden rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-flex"
          />
        }
      >
        <Avatar>
          {user.image && (
            <AvatarImage src={user.image} alt={user.name ?? "Account avatar"} />
          )}
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {user.name || "Radarly member"}
            </span>
            <span className="truncate font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard" />}>
            <LayoutDashboard />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard#settings" />}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
