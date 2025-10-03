import Link from "next/link";

import { OrgList } from "@/components/OrgList";
import { Button } from "@/components/ui/button";
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
  active: boolean | null;
  is_provider: boolean | null;
  is_broker: boolean | null;
  created_at: string | null;
  plan_id: string | null;
  billing_anchor_day: number | null;
}

export const dynamic = "force-dynamic";

export default async function OwnerHome() {
  await requireOwner();

  const supabase = supabaseAdmin();

  const [organizationsResult, plansResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, legal_name, primary_email, primary_phone, address_line1, address_line2, city, state, zip_code, country, active, is_provider, is_broker, created_at, plan_id, billing_anchor_day"
      )
      .order("created_at", { ascending: false }),
    supabase.from("plans").select("id, name"),
  ]);

  if (organizationsResult.error) {
    throw new Error(organizationsResult.error.message);
  }

  if (plansResult.error) {
    throw new Error(plansResult.error.message);
  }

  const organizations: Organization[] = organizationsResult.data ?? [];
  const planLookup = Object.fromEntries((plansResult.data ?? []).map((plan) => [plan.id, plan.name])) as Record<
    string,
    string
  >;
  const total = organizations.length;
  const activeCount = organizations.filter((org) => org.active).length;
  const mostRecentCreatedAt = organizations.at(0)?.created_at;
  const lastCreated = mostRecentCreatedAt ? new Date(mostRecentCreatedAt).toLocaleString() : "—";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage every tenant across your network. Clerk is treated as the source of truth
            and Supabase mirrors the records.
          </p>
        </div>
        <Button asChild>
          <Link href="/owner/new">+ New organization</Link>
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orgs" value={total} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Inactive" value={total - activeCount} />
        <StatCard label="Last created" value={lastCreated} />
      </section>

      <OrgList initialOrgs={organizations} planLookup={planLookup} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
