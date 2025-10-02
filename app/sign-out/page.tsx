// app/sign-out/page.tsx
"use client";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SignOutPage() {
  const { signOut } = useClerk();
  useEffect(() => {
    (async () => {
      await signOut({ redirectUrl: "/sign-in" }); // <- important
      // hard fallback (very rare):
      // window.location.href = "/sign-in";
    })();

    console.log("gaga")
  }, [signOut]);
  return <div className="p-6">Signing you out…</div>;
}
