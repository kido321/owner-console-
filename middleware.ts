// middleware.ts (at project root)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/public(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out",
  "/api/webhooks/clerk(.*)",
]);

const requiresOwner = createRouteMatcher([
  "/owner(.*)",
  "/api/owner(.*)",
  "/api/orgs(.*)",
  "/api/plans(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  if (requiresOwner(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
