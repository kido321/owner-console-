"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center p-6">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignInUrl="/owner"
        afterSignUpUrl="/owner"
      />
    </div>
  );
}
