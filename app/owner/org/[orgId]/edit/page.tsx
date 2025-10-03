import Link from "next/link";
import { notFound } from "next/navigation";

import OrgEditorForm from "@/components/OrgEditorForm";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireOwner();

  const supabase = supabaseAdmin();

  const [organizationResult, plansResult] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    supabase.from("plans").select("id, name").order("name", { ascending: true }),
  ]);

  if (organizationResult.error) {
    throw new Error(organizationResult.error.message);
  }

  if (!organizationResult.data) {
    notFound();
  }

  if (plansResult.error) {
    throw new Error(plansResult.error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit organization</h1>
          <p className="text-sm text-muted-foreground">
            Changes are persisted to Supabase and, when applicable, synced back to Clerk.
          </p>
        </div>
        <Link
          href={`/owner/org/${orgId}`}
          className="rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          Cancel
        </Link>
      </div>

      <OrgEditorForm org={organizationResult.data} plans={plansResult.data ?? []} />
    </div>
  );
}
