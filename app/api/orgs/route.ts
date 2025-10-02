import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user || user.publicMetadata?.platformRole !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("organizations").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}


import { z } from "zod";
const OrgSchema = z.object({
  id: z.string().min(2),          // your org key (text)
  name: z.string().min(2),
  primary_email: z.string().email(),
  primary_phone: z.string().min(7),
  address_line1: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  zip_code: z.string().min(3),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.platformRole !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = OrgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const sb = supabaseAdmin();
  const base = {
    legal_name: body.name,
    country: "USA",
    timezone: "America/New_York",
    default_billing_terms: 30,
    currency: "USD",
    is_provider: true,
    is_broker: false,
    active: true,
  };

  const { error: orgErr } = await sb.from("organizations").insert([{ ...base, ...body }]);
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

  // seed defaults (settings, service areas, codes, etc.) — keep idempotent
  await sb.from("organization_settings").insert([
    { org_id: body.id, setting_key: "date_format", setting_value: "MM/DD/YYYY", setting_type: "string" },
    { org_id: body.id, setting_key: "time_format", setting_value: "12h", setting_type: "string" },
  ]).throwOnError();

  return NextResponse.json({ ok: true });
}
