"use client";
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div>Axen Owner Console</div>
      <nav className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-3 py-1.5 rounded border">Sign in</button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
          {/* or a plain button: */}
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <button className="px-3 py-1.5 rounded border">Sign out</button>
          </SignOutButton>
        </SignedIn>
      </nav>
    </header>
  );
}
