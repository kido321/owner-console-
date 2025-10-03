import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

const UpdatePlanSchema = z.object({
  name: z.string().min(2).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await context.params;
    await requireOwner();

    const payload = await request.json();
    const parsed = UpdatePlanSchema.parse(payload);

    if (!parsed.name) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("plans")
      .update({ name: parsed.name })
      .eq("id", planId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unable to update plan";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await context.params;
    await requireOwner();

    const supabase = supabaseAdmin();

    const { error: featureError } = await supabase
      .from("plan_features")
      .delete()
      .eq("plan_id", planId);

    if (featureError) throw featureError;

    const { error: planError } = await supabase.from("plans").delete().eq("id", planId);

    if (planError) throw planError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete plan";
    const status = error instanceof Error && error.name === "OwnerAccessError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
