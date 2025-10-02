"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Org = {
  id: string;
  name?: string | null;
  legal_name?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

export function OrgList({ initialOrgs }: { initialOrgs: Org[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return initialOrgs;
    return initialOrgs.filter((o) => {
      const blob = [
        o.name,
        o.legal_name,
        o.id,
        o.primary_email,
        o.primary_phone,
        o.city,
        o.state,
        o.zip_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [q, initialOrgs]);

  return (
    <section className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, city, ID…"
          className="max-w-md"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border p-8 text-center">
          <div className="text-base font-medium">No organizations found</div>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different search, or{" "}
            <Link href="/owner/new" className="underline">
              create a new organization
            </Link>
            .
          </p>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filtered.map((o) => (
          <OrgCard key={o.id} org={o} />
        ))}
      </div>
    </section>
  );
}

function OrgCard({ org }: { org: Org }) {
  const addr = [org.address_line1, org.city, org.state, org.zip_code]
    .filter(Boolean)
    .join(", ");
  const created = org.created_at
    ? new Date(org.created_at).toLocaleString()
    : "—";

  return (
    <div className="rounded-2xl border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold leading-tight">
            {org.name || org.legal_name || "(no name)"}{" "}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">ID: {org.id}</div>
        </div>
        <Badge variant={org.active ? "default" : "secondary"}>
          {org.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {org.primary_email && (
          <div className="truncate">
            <span className="text-muted-foreground">Email: </span>
            {org.primary_email}
          </div>
        )}
        {org.primary_phone && (
          <div>
            <span className="text-muted-foreground">Phone: </span>
            {org.primary_phone}
          </div>
        )}
        {addr && (
          <div className="truncate">
            <span className="text-muted-foreground">Address: </span>
            {addr}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Created: {created}</div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/owner/org/${org.id}`}
          className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Open
        </Link>
        <Link
          href={`/owner/org/${org.id}/edit`}
          className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
