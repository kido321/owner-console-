"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignOutButton, UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/owner", label: "Owner" },
  { href: "/owner/billing", label: "Billing" },
  { href: "/owner/plans", label: "Plans" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          Axen Owner Console
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign in
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/sign-in" />
            <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
              <button className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                Sign out
              </button>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
