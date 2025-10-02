// app/api/debug/env/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    hasPub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSec: !!process.env.CLERK_SECRET_KEY,
  });
}
