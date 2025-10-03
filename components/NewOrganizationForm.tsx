"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { US_STATES } from "@/lib/constants";

type PlanOption = {
  id: string;
  name: string;
};

interface NewOrganizationFormProps {
  plans: PlanOption[];
}

export default function NewOrganizationForm({ plans }: NewOrganizationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPlanId = plans[0]?.id ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    const getValue = (key: string) => formData.get(key)?.toString().trim() ?? "";

    const name = getValue("name");
    const legalName = getValue("legal_name");
    const slugInput = getValue("slug");
    const primaryEmail = getValue("primary_email");
    const primaryPhone = getValue("primary_phone");
    const addressLine1 = getValue("address_line1");
    const addressLine2 = getValue("address_line2");
    const city = getValue("city");
    const state = getValue("state").toUpperCase();
    const zip = getValue("zip_code");
    const country = getValue("country") || "USA";
    const planId = getValue("plan_id");
    const billingAnchorRaw = getValue("billing_anchor_day");
    const isProvider = formData.get("is_provider") === "on";
    const isBroker = formData.get("is_broker") === "on";

    const normalizedSlug = slugInput
      ? slugInput
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-{2,}/g, "-")
          .replace(/^-|-$/g, "")
      : undefined;

    let billingAnchorDay: number | null = null;
    if (billingAnchorRaw) {
      const parsed = Number(billingAnchorRaw);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 28) {
        setError("Billing anchor day must be a number between 1 and 28.");
        return;
      }
      billingAnchorDay = parsed;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        name,
        legal_name: legalName || undefined,
        slug: normalizedSlug,
        primary_email: primaryEmail,
        primary_phone: primaryPhone,
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        city,
        state,
        zip_code: zip,
        country,
        is_provider: isProvider,
        is_broker: isBroker,
      };

      if (planId) payload.plan_id = planId;
      if (billingAnchorDay !== null) payload.billing_anchor_day = billingAnchorDay;

      const response = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const message =
          typeof result?.error === "string"
            ? result.error
            : "Unable to create organization. Please review the fields and try again.";
        setError(message);
        return;
      }

      router.push("/owner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A Clerk organization will be created first. On success, a matching record is inserted into Supabase
          using the returned Clerk organization id as the primary key.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name
            </label>
            <Input id="name" name="name" placeholder="Acme Transportation" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="legal_name" className="block text-sm font-medium text-foreground">
              Legal name
            </label>
            <Input id="legal_name" name="legal_name" placeholder="Acme Transportation LLC" />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-foreground">
              Clerk slug (optional)
            </label>
            <Input id="slug" name="slug" placeholder="acme" />
          </div>

          <div className="space-y-2">
            <label htmlFor="primary_email" className="block text-sm font-medium text-foreground">
              Primary email
            </label>
            <Input id="primary_email" name="primary_email" type="email" placeholder="owner@acme.io" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="primary_phone" className="block text-sm font-medium text-foreground">
              Primary phone
            </label>
            <Input id="primary_phone" name="primary_phone" placeholder="+1 555 555 1234" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="address_line1" className="block text-sm font-medium text-foreground">
              Address line 1
            </label>
            <Input id="address_line1" name="address_line1" placeholder="123 Market Street" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="address_line2" className="block text-sm font-medium text-foreground">
              Address line 2
            </label>
            <Input id="address_line2" name="address_line2" placeholder="Suite 200" />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-foreground">
              City
            </label>
            <Input id="city" name="city" placeholder="Austin" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="state" className="block text-sm font-medium text-foreground">
              State
            </label>
            <select
              id="state"
              name="state"
              defaultValue="TX"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              required
            >
              <option value="">Select state</option>
              {US_STATES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="zip_code" className="block text-sm font-medium text-foreground">
              ZIP / Postal code
            </label>
            <Input id="zip_code" name="zip_code" placeholder="73301" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="block text-sm font-medium text-foreground">
              Country
            </label>
            <Input id="country" name="country" placeholder="USA" defaultValue="USA" />
          </div>

          <div className="space-y-2">
            <label htmlFor="plan_id" className="block text-sm font-medium text-foreground">
              Subscription plan
            </label>
            <select
              id="plan_id"
              name="plan_id"
              defaultValue={defaultPlanId}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">No plan (custom)
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="billing_anchor_day" className="block text-sm font-medium text-foreground">
              Billing anchor day
            </label>
            <Input
              id="billing_anchor_day"
              name="billing_anchor_day"
              type="number"
              min={1}
              max={28}
              placeholder="1-28"
            />
            <p className="text-xs text-muted-foreground">
              Optional. Used to align invoices to a fixed day of the month.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="is_provider"
              defaultChecked
              className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
            />
            Provider
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="is_broker"
              className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
            />
            Broker
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create organization"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
