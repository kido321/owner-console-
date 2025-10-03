"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Org = {
  id: string;
  name?: string | null;
  legal_name?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  active?: boolean | null;
  is_provider?: boolean | null;
  is_broker?: boolean | null;
  created_at?: string | null;
  plan_id?: string | null;
  billing_anchor_day?: number | null;
};

export function OrgList({
  initialOrgs,
  planLookup,
}: {
  initialOrgs: Org[];
  planLookup?: Record<string, string>;
}) {
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
        o.country,
        o.is_provider ? "provider" : null,
        o.is_broker ? "broker" : null,
        o.plan_id ? planLookup?.[o.plan_id] ?? o.plan_id : "custom",
        o.billing_anchor_day ? String(o.billing_anchor_day) : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [q, initialOrgs, planLookup]);

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((o) => {
          const planNameFromLookup = o.plan_id ? planLookup?.[o.plan_id] : undefined;
          const planBadgeLabel = o.plan_id ? planNameFromLookup ?? o.plan_id ?? undefined : undefined;
          const planDetail = o.plan_id
            ? planNameFromLookup && planNameFromLookup !== o.plan_id
              ? `${planNameFromLookup} (${o.plan_id})`
              : o.plan_id
            : "Custom (no plan)";
          return (
            <OrgCard
              key={o.id}
              org={o}
              planBadgeLabel={planBadgeLabel}
              planDetail={planDetail}
            />
          );
        })}
      </div>
    </section>
  );
}

function OrgCard({
  org,
  planBadgeLabel,
  planDetail,
}: {
  org: Org;
  planBadgeLabel?: string;
  planDetail?: string;
}) {
  const addr = [org.address_line1, org.address_line2, org.city, org.state, org.zip_code]
    .filter(Boolean)
    .join(", ");
  const created = org.created_at
    ? new Date(org.created_at).toLocaleString()
    : "—";

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold leading-tight">
            {org.name || org.legal_name || "(no name)"}{" "}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">ID: {org.id}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={org.active ? "default" : "secondary"}>
            {org.active ? "Active" : "Inactive"}
          </Badge>
          {org.is_provider && <Badge variant="outline">Provider</Badge>}
          {org.is_broker && <Badge variant="outline">Broker</Badge>}
          {planBadgeLabel !== undefined && <Badge variant="outline">{planBadgeLabel}</Badge>}
        </div>
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
        {planDetail !== undefined && (
          <div className="text-xs text-muted-foreground">
            Plan: <span className="font-medium text-foreground/80">{planDetail}</span>
          </div>
        )}
        {org.billing_anchor_day !== null && org.billing_anchor_day !== undefined && (
          <div className="text-xs text-muted-foreground">
            Billing anchor day: {org.billing_anchor_day}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Created: {created}</div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button asChild size="sm">
          <Link href={`/owner/org/${org.id}`}>Open</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/owner/org/${org.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </div>
  );
}
