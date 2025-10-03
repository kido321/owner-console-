import PlansManager from "@/components/PlansManager";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  await requireOwner();

  const supabase = supabaseAdmin();

  const [plansResult, planFeaturesResult, featureDefinitionsResult] = await Promise.all([
    supabase
      .from("plans")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("plan_features")
      .select("plan_id, feature_key, value, enforced")
      .order("plan_id", { ascending: true }),
    supabase
      .from("feature_definitions")
      .select("key, name, description, ftype, default_value, unit, is_metered")
      .order("name", { ascending: true }),
  ]);

  if (plansResult.error) {
    throw new Error(plansResult.error.message);
  }

  if (planFeaturesResult.error) {
    throw new Error(planFeaturesResult.error.message);
  }

  if (featureDefinitionsResult.error) {
    throw new Error(featureDefinitionsResult.error.message);
  }

  return (
    <PlansManager
      plans={plansResult.data ?? []}
      planFeatures={planFeaturesResult.data ?? []}
      featureDefinitions={featureDefinitionsResult.data ?? []}
    />
  );
}
