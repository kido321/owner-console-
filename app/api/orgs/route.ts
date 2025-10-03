import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .max(50)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  legal_name: z
    .string()
    .max(120)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  primary_email: z.string().email(),
  primary_phone: z.string().min(4, "Phone is required"),
  address_line1: z.string().min(2, "Address is required"),
  address_line2: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip_code: z.string().min(3, "Postal code is required"),
  country: z.string().min(2).default("USA"),
  is_provider: z.coerce.boolean().default(true),
  is_broker: z.coerce.boolean().default(false),
  plan_id: z.string().min(1).optional(),
  billing_anchor_day: z.coerce.number().int().min(1).max(28).optional(),
});

const mapCreateParams = (input: z.infer<typeof CreateOrganizationSchema>) => ({
  name: input.name,
  legal_name: input.legal_name ?? input.name,
  primary_email: input.primary_email,
  primary_phone: input.primary_phone,
  address_line1: input.address_line1,
  address_line2: input.address_line2 ?? null,
  city: input.city,
  state: input.state,
  zip_code: input.zip_code,
  country: input.country ?? "USA",
  is_provider: input.is_provider,
  is_broker: input.is_broker,
  active: true,
  default_billing_terms: 30,
  currency: "USD",
  plan_id: input.plan_id ?? null,
  billing_anchor_day: input.billing_anchor_day ?? null,
});

export async function GET() {
  try {
    await requireOwner();
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, name, legal_name, primary_email, primary_phone, address_line1, city, state, zip_code, country, active, is_provider, is_broker, created_at, plan_id, billing_anchor_day"
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ organizations: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load organizations";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOwner();
    const body = await request.json();
    const parsedBody = CreateOrganizationSchema.parse(body);

    const clerk = await clerkClient();

    const organization = await clerk.organizations.createOrganization({
      name: parsedBody.name,
      slug: parsedBody.slug,
      createdBy: user.id,
      publicMetadata: {
        source: "owner-console",
        legal_name: parsedBody.legal_name ?? parsedBody.name,
        primary_email: parsedBody.primary_email,
        primary_phone: parsedBody.primary_phone,
        address_line1: parsedBody.address_line1,
        address_line2: parsedBody.address_line2 ?? undefined,
        city: parsedBody.city,
        state: parsedBody.state,
        zip_code: parsedBody.zip_code,
        country: parsedBody.country ?? "USA",
        is_provider: parsedBody.is_provider,
        is_broker: parsedBody.is_broker,
        currency: "USD",
        default_billing_terms: 30,
        plan_id: parsedBody.plan_id ?? null,
        billing_anchor_day: parsedBody.billing_anchor_day ?? null,
      },
    });

    const supabase = supabaseAdmin();
    const insertPayload = {
      id: organization.id,
      ...mapCreateParams(parsedBody),
    };

    const { error: insertError } = await supabase.from("organizations").insert(insertPayload);

    if (insertError) {
      await clerk.organizations.deleteOrganization(organization.id);
      throw new Error(insertError.message);
    }

    const { error: settingsError } = await supabase.from("organization_settings").insert([
      {
        org_id: organization.id,
        setting_key: "date_format",
        setting_value: "MM/DD/YYYY",
        setting_type: "string",
      },
      {
        org_id: organization.id,
        setting_key: "time_format",
        setting_value: "12h",
        setting_type: "string",
      },
    ]);

    if (settingsError && settingsError.code !== "23505") {
      console.warn("Failed to seed organization_settings", settingsError);
    }

    return NextResponse.json({ ok: true, organizationId: organization.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unable to create organization";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
