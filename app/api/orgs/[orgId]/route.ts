import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const UpdateOrganizationSchema = z
  .object({
    name: z.string().min(2).optional(),
    legal_name: z.string().optional().or(z.literal("")).or(z.null()),
    primary_email: z.string().email().optional().or(z.literal("")).or(z.null()),
    primary_phone: z.string().optional().or(z.literal("")).or(z.null()),
    address_line1: z.string().optional().or(z.literal("")).or(z.null()),
    address_line2: z.string().optional().or(z.literal("")).or(z.null()),
    city: z.string().optional().or(z.literal("")).or(z.null()),
    state: z.string().optional().or(z.literal("")).or(z.null()),
    zip_code: z.string().optional().or(z.literal("")).or(z.null()),
    country: z.string().optional().or(z.literal("")).or(z.null()),
    is_provider: z.coerce.boolean().optional(),
    is_broker: z.coerce.boolean().optional(),
    active: z.coerce.boolean().optional(),
    plan_id: z.string().optional().or(z.literal("")).or(z.null()),
    billing_anchor_day: z.union([z.coerce.number().int().min(1).max(28), z.null()]).optional(),
  })
  .transform((value) => {
    const transformed = { ...value } as Record<string, unknown>;
    for (const key of Object.keys(transformed)) {
      const current = transformed[key];
      if (typeof current === "string") {
        const trimmed = current.trim();
        transformed[key] = trimmed.length === 0 ? null : trimmed;
      }
    }
    return transformed;
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    await requireOwner();
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load organization";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    await requireOwner();
    const body = await request.json();
    const parsed = UpdateOrganizationSchema.parse(body);
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("organizations")
      .update(update)
      .eq("id", orgId)
      .select("*")
      .maybeSingle();

    if (error) {
      if (typeof error.code === "string" && error.code === "23503") {
        return NextResponse.json(
          { error: "Plan id is invalid. Please select an existing plan or clear the field." },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const metadataKeys: Record<string, string> = {
      legal_name: "legal_name",
      primary_email: "primary_email",
      primary_phone: "primary_phone",
      address_line1: "address_line1",
      address_line2: "address_line2",
      city: "city",
      state: "state",
      zip_code: "zip_code",
      country: "country",
      is_provider: "is_provider",
      is_broker: "is_broker",
      active: "active",
      plan_id: "plan_id",
      billing_anchor_day: "billing_anchor_day",
    };

    const publicMetadataUpdates: Record<string, unknown> = {};

    for (const key of Object.keys(update)) {
      const metadataKey = metadataKeys[key];
      if (metadataKey) {
        publicMetadataUpdates[metadataKey] = update[key];
      }
    }

    const clerkUpdate: {
      name?: string;
      publicMetadata?: Record<string, unknown>;
    } = {};

    if (typeof update.name === "string") {
      clerkUpdate.name = update.name;
    }

    if (Object.keys(publicMetadataUpdates).length > 0) {
      clerkUpdate.publicMetadata = publicMetadataUpdates;
    }

    if (Object.keys(clerkUpdate).length > 0) {
      const clerk = await clerkClient();
      await clerk.organizations.updateOrganization(orgId, clerkUpdate);
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unable to update organization";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
