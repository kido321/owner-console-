import { currentUser } from "@clerk/nextjs/server";

async function fetchJSON(path: string) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("Load failed");
  return res.json();
}

export default async function OrgDetail({ params }: { params: { orgId: string } }) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.platformRole !== "owner") return <div>Forbidden</div>;

  const [org, users, drivers, vehicles] = await Promise.all([
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orgs/${params.orgId}`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orgs/${params.orgId}/users`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orgs/${params.orgId}/drivers`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orgs/${params.orgId}/vehicles`),
  ]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{org.name}</h1>
      <section>
        <h2 className="font-medium mb-2">Users</h2>
        <ul className="list-disc pl-5">{users.map((u:any)=><li key={u.clerk_user_id}>{u.email} — {u.role}</li>)}</ul>
      </section>
      <section>
        <h2 className="font-medium mb-2">Drivers</h2>
        <ul className="list-disc pl-5">{drivers.map((d:any)=><li key={d.id}>{d.license_number} — {d.status ?? "n/a"}</li>)}</ul>
      </section>
      <section>
        <h2 className="font-medium mb-2">Vehicles</h2>
        <ul className="list-disc pl-5">{vehicles.map((v:any)=><li key={v.id}>{v.make} {v.model} {v.year} — {v.license_plate}</li>)}</ul>
      </section>
    </main>
  );
}
