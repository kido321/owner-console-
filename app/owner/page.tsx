import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OrgList } from "@/components/OrgList";
import { Badge } from "@/components/ui/badge";

export default async function OwnerHome() {
  const user = await currentUser();
  const role = (user?.publicMetadata as any)?.platformRole;

  const sb = supabaseAdmin();
  const { data: orgs, error } = await sb
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const total = orgs?.length ?? 0;
  const activeCount = orgs?.filter((o: any) => o.active).length ?? 0;

  return (
    <main className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Manage tenants, view status, and jump into details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/owner/new"
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            + New organization
          </a>
        </div>
      </div>

      {/* Soft banner if the signed-in user isn't owner (non-blocking hint) */}
      {role !== "owner" && (
        <div className="rounded-2xl border bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You’re signed in as <span className="font-medium">{user?.emailAddresses?.[0]?.emailAddress}</span>, role <Badge variant="secondary"> {String(role ?? "none")} </Badge>.  
          To enforce owner-only access, enable the role check or gate via middleware.
        </div>
      )}

      {/* Quick stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total orgs" value={total} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Inactive" value={total - activeCount} />
        <StatCard
          label="Last created"
          value={orgs?.[0]?.created_at ? new Date(orgs[0].created_at).toLocaleDateString() : "—"}
        />
      </section>

      {/* Search + List */}
      <OrgList initialOrgs={orgs ?? []} />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
