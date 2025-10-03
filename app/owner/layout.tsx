import { currentUser } from "@clerk/nextjs/server";

import { userHasOwnerRole } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!userHasOwnerRole(user)) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You must be signed in with the owner account to view the console.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 lg:px-8">
      {children}
    </div>
  );
}
