import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Platform Owner Console
      </div>
      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Manage every organization across your NEMT network from a single, secure hub.
      </h1>
      <p className="mt-4 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
        Create new tenants in Clerk, mirror them to Supabase automatically, and keep everything in
        sync with server-side workflows. Only the platform owner can access the console.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Sign in as owner
        </Link>
        <Link
          href="/owner"
          className="rounded-full border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          View console
        </Link>
      </div>
    </div>
  );
}
