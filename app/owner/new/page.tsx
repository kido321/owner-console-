import NewOrganizationForm from "@/components/NewOrganizationForm";
import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function NewOrganizationPage() {
  await requireOwner();

  const supabase = supabaseAdmin();
  const { data: plansData, error } = await supabase
    .from("plans")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return <NewOrganizationForm plans={plansData ?? []} />;
}
