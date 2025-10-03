import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface Organization {
  id: string;
  name: string;
  legal_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  is_provider: boolean | null;
  is_broker: boolean | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  plan_id: string | null;
  billing_anchor_day: number | null;
}

interface FeatureRow {
  feature_key: string;
  value_as_text: string | null;
  ftype: string;
  unit: string | null;
  is_metered: boolean | null;
}

export default async function OrganizationDetail({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireOwner();

  const supabase = supabaseAdmin();
  const organizationResult = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (organizationResult.error) {
    throw new Error(organizationResult.error.message);
  }

  if (!organizationResult.data) {
    notFound();
  }

  const organization = organizationResult.data as Organization;

  const [planResult, featuresResult] = await Promise.all([
    organization.plan_id
      ? supabase
          .from("plans")
          .select("id, name")
          .eq("id", organization.plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("org_feature_effective_typed")
      .select("feature_key, value_as_text, ftype, unit, is_metered")
      .eq("org_id", orgId)
      .order("feature_key", { ascending: true }),
  ]);

  if (planResult && planResult.error) {
    throw new Error(planResult.error.message);
  }

  if (featuresResult.error) {
    throw new Error(featuresResult.error.message);
  }

  const planName = planResult?.data?.name ?? null;
  const planDisplay = planName
    ? `${planName}${organization.plan_id ? ` (${organization.plan_id})` : ""}`
    : organization.plan_id ?? "Custom (no plan)";
  const featureRows: FeatureRow[] = featuresResult.data ?? [];

  const fullAddress = [
    organization.address_line1,
    organization.address_line2,
    organization.city,
    organization.state,
    organization.zip_code,
    organization.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">{organization.id}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={organization.active ? "default" : "secondary"}>
              {organization.active ? "Active" : "Inactive"}
            </Badge>
            {organization.is_provider && <Badge variant="outline">Provider</Badge>}
            {organization.is_broker && <Badge variant="outline">Broker</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/owner/org/${organization.id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Edit
          </Link>
          <Link
            href="/owner"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            Back to list
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2">
        <DetailField label="Legal name" value={organization.legal_name} />
        <DetailField label="Primary email" value={organization.primary_email} />
        <DetailField label="Primary phone" value={organization.primary_phone} />
        <DetailField label="Address" value={fullAddress || "—"} />
        <DetailField
          label="Subscription plan"
          value={planDisplay}
        />
        <DetailField
          label="Billing anchor day"
          value={
            organization.billing_anchor_day !== null
              ? organization.billing_anchor_day.toString()
              : "—"
          }
        />
        <DetailField label="Created" value={formatDate(organization.created_at)} />
        <DetailField label="Updated" value={formatDate(organization.updated_at)} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Effective features</h2>
          <p className="text-sm text-muted-foreground">
            Overrides take precedence over plan values, followed by plan configuration and then catalog
            defaults.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Feature</th>
                <th className="px-4 py-2 text-left font-medium">Value</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Unit</th>
                <th className="px-4 py-2 text-left font-medium">Metered</th>
              </tr>
            </thead>
            <tbody>
              {featureRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No features defined in the catalog.
                  </td>
                </tr>
              ) : (
                featureRows.map((feature) => (
                  <tr key={feature.feature_key} className="border-t text-foreground">
                    <td className="px-4 py-2 font-medium">{feature.feature_key}</td>
                    <td className="px-4 py-2">
                      {feature.value_as_text ?? "—"}
                    </td>
                    <td className="px-4 py-2 capitalize">{feature.ftype}</td>
                    <td className="px-4 py-2">{feature.unit ?? "—"}</td>
                    <td className="px-4 py-2">{feature.is_metered ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value && value !== "" ? value : "—"}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
