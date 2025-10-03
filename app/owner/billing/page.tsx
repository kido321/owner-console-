import Link from "next/link";

import BillingReadiness from "@/components/BillingReadiness";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

type OrganizationRow = {
  id: string;
  name: string;
  legal_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  plan_id: string | null;
  billing_anchor_day: number | null;
  active: boolean | null;
  created_at: string | null;
};

type PlanRow = {
  id: string;
  name: string;
};

type FeatureRow = {
  org_id: string;
  feature_key: string;
  value_as_text: string | null;
};

const FEATURE_KEYS = [
  "min_monthly_cents",
  "vehicle_unit_price_cents",
  "vehicle_limit",
];

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  await requireOwner();
  const supabase = supabaseAdmin();

  const [organizationsResult, plansResult, featuresResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, legal_name, primary_email, primary_phone, plan_id, billing_anchor_day, active, created_at"
      )
      .order("created_at", { ascending: true }),
    supabase.from("plans").select("id, name"),
    supabase
      .from("org_feature_effective_typed")
      .select("org_id, feature_key, value_as_text")
      .in("feature_key", FEATURE_KEYS),
  ]);

  if (organizationsResult.error) throw new Error(organizationsResult.error.message);
  if (plansResult.error) throw new Error(plansResult.error.message);
  if (featuresResult.error) throw new Error(featuresResult.error.message);

  const organizations = (organizationsResult.data ?? []) as OrganizationRow[];
  const plans = (plansResult.data ?? []) as PlanRow[];
  const features = (featuresResult.data ?? []) as FeatureRow[];

  const planLookup = new Map(plans.map((plan) => [plan.id, plan.name]));

  const featureLookup = features.reduce<Record<string, Record<string, string | null>>>((acc, row) => {
    if (!acc[row.org_id]) acc[row.org_id] = {};
    acc[row.org_id][row.feature_key] = row.value_as_text;
    return acc;
  }, {});

  const enhanced = organizations.map((org) => {
    const planName = org.plan_id ? planLookup.get(org.plan_id) ?? null : null;
    const orgFeatures = featureLookup[org.id] ?? {};
    const blockers: string[] = [];

    if (!org.plan_id) blockers.push("Assign a subscription plan");
    if (org.plan_id && !planName) blockers.push("Referenced plan no longer exists");
    if (!org.billing_anchor_day && org.plan_id) blockers.push("Set billing anchor day");
    if (!org.primary_email) blockers.push("Add billing email");

    const ready = blockers.length === 0;

    const nextInvoiceDate = computeNextInvoiceDate(org.billing_anchor_day);

    return {
      id: org.id,
      name: org.name,
      legalName: org.legal_name,
      planId: org.plan_id,
      planName,
      billingAnchorDay: org.billing_anchor_day,
      primaryEmail: org.primary_email,
      primaryPhone: org.primary_phone,
      active: Boolean(org.active),
      createdAt: org.created_at,
      ready,
      blockers,
      nextInvoiceDate,
      features: {
        minMonthlyCents: orgFeatures.min_monthly_cents ?? null,
        vehicleUnitPriceCents: orgFeatures.vehicle_unit_price_cents ?? null,
        vehicleLimit: orgFeatures.vehicle_limit ?? null,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Billing readiness</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review which organizations are ready to invoice, identify blockers, and jump into plan or organization
            details to make updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/owner/plans"
            className="rounded-xl border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            Manage plans
          </Link>
        </div>
      </div>

      <BillingReadiness organizations={enhanced} />
    </div>
  );
}

function computeNextInvoiceDate(anchorDay: number | null) {
  if (!anchorDay) return null;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (now.getDate() >= anchorDay) {
    month += 1;
  }

  const date = new Date(year, month, Math.min(anchorDay, daysInMonth(year, month)));
  return date.toISOString();
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
