import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const PlanFeatureSchema = z.object({
  feature_key: z.string().min(1, "Feature key is required"),
  value: z.string().min(1, "Value is required"),
  enforced: z.boolean().optional().default(true),
});

const UpdatePlanFeaturesSchema = z.object({
  features: z.array(PlanFeatureSchema),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await context.params;
    await requireOwner();

    const payload = await request.json();
    const parsed = UpdatePlanFeaturesSchema.parse(payload);

    const supabase = supabaseAdmin();

    const { error: deleteError } = await supabase
      .from("plan_features")
      .delete()
      .eq("plan_id", planId);

    if (deleteError) {
      throw deleteError;
    }

    if (parsed.features.length > 0) {
      const insertPayload = parsed.features.map((feature) => ({
        plan_id: planId,
        feature_key: feature.feature_key,
        value: feature.value,
        enforced: feature.enforced ?? true,
      }));

      const { error: insertError } = await supabase
        .from("plan_features")
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unable to update plan features";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
