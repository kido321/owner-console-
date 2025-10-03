import { NextResponse } from "next/server";

import { getOwnerRole } from "@/lib/auth";

export async function GET() {
  const { user, platformRole } = await getOwnerRole();

  if (!user) {
    return NextResponse.json({ userId: null, email: null, platformRole: null }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    platformRole,
  });
}
