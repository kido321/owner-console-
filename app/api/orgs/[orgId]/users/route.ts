import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(_: Request, { params }: { params: { orgId: string } }) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.platformRole !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("users").select("*").eq("org_id", params.orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
