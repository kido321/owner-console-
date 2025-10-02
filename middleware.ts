// middleware.ts (at project root)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/public(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out",
]);

const isOwnerArea = createRouteMatcher([
  "/owner(.*)",
  "/api/owner(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;            // don't block auth pages
  if (isOwnerArea(req)) await auth.protect();
  // everything else stays public for now
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
