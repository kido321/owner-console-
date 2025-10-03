"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BillingOrganization {
  id: string;
  name: string;
  legalName: string | null;
  planId: string | null;
  planName: string | null;
  billingAnchorDay: number | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  active: boolean;
  createdAt: string | null;
  ready: boolean;
  blockers: string[];
  nextInvoiceDate: string | null;
  features: {
    minMonthlyCents: string | null;
    vehicleUnitPriceCents: string | null;
    vehicleLimit: string | null;
  };
}

interface BillingReadinessProps {
  organizations: BillingOrganization[];
}

type FilterOption = "all" | "ready" | "needs_attention";

type SortOption = "name" | "anchor" | "plan";

export default function BillingReadiness({ organizations }: BillingReadinessProps) {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("name");

  const summary = useMemo(() => {
    const readyCount = organizations.filter((org) => org.ready).length;
    const missingPlan = organizations.filter((org) => !org.planId).length;
    const missingAnchor = organizations.filter((org) => org.planId && !org.billingAnchorDay).length;
    return { readyCount, missingPlan, missingAnchor };
  }, [organizations]);

  const filtered = useMemo(() => {
    let list = organizations;
    if (filter === "ready") {
      list = list.filter((org) => org.ready);
    } else if (filter === "needs_attention") {
      list = list.filter((org) => !org.ready);
    }

    const sorted = [...list].sort((a, b) => {
      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sort === "plan") {
        const aPlan = a.planName ?? a.planId ?? "zzz";
        const bPlan = b.planName ?? b.planId ?? "zzz";
        return aPlan.localeCompare(bPlan);
      }

      if (sort === "anchor") {
        const aAnchor = a.billingAnchorDay ?? 99;
        const bAnchor = b.billingAnchorDay ?? 99;
        return aAnchor - bAnchor;
      }

      return 0;
    });

    return sorted;
  }, [organizations, filter, sort]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Ready to invoice" value={summary.readyCount} />
        <SummaryCard label="Missing plan" value={summary.missingPlan} />
        <SummaryCard label="Missing anchor" value={summary.missingAnchor} />
        <SummaryCard label="Total orgs" value={organizations.length} />
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
            <FilterButton active={filter === "ready"} onClick={() => setFilter("ready")}>
              Ready
            </FilterButton>
            <FilterButton active={filter === "needs_attention"} onClick={() => setFilter("needs_attention")}>
              Needs attention
            </FilterButton>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="name">Name</option>
              <option value="plan">Plan</option>
              <option value="anchor">Anchor day</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Organization</th>
                <th className="px-4 py-2 text-left font-medium">Plan</th>
                <th className="px-4 py-2 text-left font-medium">Billing</th>
                <th className="px-4 py-2 text-left font-medium">Pricing</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No organizations match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((org) => (
                <tr key={org.id} className="border-t">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">{org.name}</div>
                    <div className="text-xs text-muted-foreground">{org.id}</div>
                    {org.legalName && (
                      <div className="text-xs text-muted-foreground">Legal: {org.legalName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {org.planId ? (
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{org.planName ?? org.planId}</div>
                        {org.planName && (
                          <div className="text-xs text-muted-foreground">Plan id: {org.planId}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No plan assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-foreground">
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Anchor:</span>{" "}
                        {org.billingAnchorDay ? `day ${org.billingAnchorDay}` : "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next invoice:</span>{" "}
                        {org.nextInvoiceDate ? formatDate(org.nextInvoiceDate) : "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span>{" "}
                        {org.primaryEmail ?? "—"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-foreground">
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Min monthly:</span>{" "}
                        {formatCurrency(org.features.minMonthlyCents)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle unit:</span>{" "}
                        {formatCurrency(org.features.vehicleUnitPriceCents)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle limit:</span>{" "}
                        {org.features.vehicleLimit ?? "—"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {org.ready ? (
                      <Badge variant="default">Ready</Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="secondary">Needs attention</Badge>
                        <ul className="list-disc pl-4 text-xs text-muted-foreground">
                          {org.blockers.map((blocker) => (
                            <li key={blocker}>{blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      <Button asChild size="sm">
                        <Link href={`/owner/org/${org.id}`}>Open org</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/owner/org/${org.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function formatCurrency(value: string | null) {
  if (!value) return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric / 100);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
