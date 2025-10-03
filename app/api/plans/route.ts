import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const CreatePlanSchema = z.object({
  id: z
    .string()
    .min(2, "Plan id is required")
    .regex(/^[a-z0-9_-]+$/i, "Plan id can contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(2, "Plan name is required"),
  features: z
    .array(
      z.object({
        feature_key: z.string().min(1),
        value: z.string().min(1),
        enforced: z.boolean().optional().default(true),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    await requireOwner();
    const supabase = supabaseAdmin();

    const [plans, planFeatures] = await Promise.all([
      supabase.from("plans").select("id, name, created_at").order("created_at", { ascending: true }),
      supabase
        .from("plan_features")
        .select("plan_id, feature_key, value, enforced")
        .order("plan_id", { ascending: true }),
    ]);

    if (plans.error) throw plans.error;
    if (planFeatures.error) throw planFeatures.error;

    return NextResponse.json({
      plans: plans.data ?? [],
      planFeatures: planFeatures.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load plans";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const payload = await request.json();
    const parsed = CreatePlanSchema.parse(payload);

    const supabase = supabaseAdmin();

    const { error: planError } = await supabase.from("plans").insert({
      id: parsed.id,
      name: parsed.name,
    });

    if (planError) {
      throw planError;
    }

    if (parsed.features && parsed.features.length > 0) {
      const insertPayload = parsed.features.map((feature) => ({
        plan_id: parsed.id,
        feature_key: feature.feature_key,
        value: feature.value,
        enforced: feature.enforced ?? true,
      }));

      const { error: featureError } = await supabase.from("plan_features").insert(insertPayload);

      if (featureError) {
        throw featureError;
      }
    }

    return NextResponse.json({ ok: true, planId: parsed.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unable to create plan";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
