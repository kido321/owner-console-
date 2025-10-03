import { NextResponse } from "next/server";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    await requireOwner();
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("users").select("*").eq("org_id", orgId);
    if (error) throw error;
    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load users";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
