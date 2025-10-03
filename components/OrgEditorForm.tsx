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

interface OrgEditorFormProps {
  org: {
    id: string;
    name: string;
    legal_name?: string | null;
    primary_email?: string | null;
    primary_phone?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    country?: string | null;
    is_provider?: boolean | null;
    is_broker?: boolean | null;
    active?: boolean | null;
    plan_id?: string | null;
    billing_anchor_day?: number | null;
  };
  plans: PlanOption[];
}

export default function OrgEditorForm({ org, plans }: OrgEditorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; content: string } | null>(null);

  const planOptions =
    org.plan_id && !plans.some((plan) => plan.id === org.plan_id)
      ? [...plans, { id: org.plan_id, name: `${org.plan_id} (archived)` }]
      : plans;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const getValue = (key: string) => formData.get(key)?.toString().trim() ?? "";

    const payload: Record<string, unknown> = {};
    const maybeAssign = (key: string, value: unknown, original: unknown) => {
      if (value !== original) {
        payload[key] = value;
      }
    };

    const name = getValue("name");
    maybeAssign("name", name, org.name);

    const legalName = getValue("legal_name");
    maybeAssign("legal_name", legalName || null, org.legal_name ?? null);

    const primaryEmail = getValue("primary_email");
    maybeAssign("primary_email", primaryEmail || null, org.primary_email ?? null);

    const primaryPhone = getValue("primary_phone");
    maybeAssign("primary_phone", primaryPhone || null, org.primary_phone ?? null);

    const address1 = getValue("address_line1");
    maybeAssign("address_line1", address1 || null, org.address_line1 ?? null);

    const address2 = getValue("address_line2");
    maybeAssign("address_line2", address2 || null, org.address_line2 ?? null);

    const city = getValue("city");
    maybeAssign("city", city || null, org.city ?? null);

    const stateInput = getValue("state");
    if (stateInput) {
      const normalizedState = stateInput.toUpperCase();
      maybeAssign("state", normalizedState, org.state ?? null);
    }

    const zip = getValue("zip_code");
    maybeAssign("zip_code", zip || null, org.zip_code ?? null);

    const country = getValue("country");
    maybeAssign("country", country || null, org.country ?? null);

    const planIdValue = getValue("plan_id");
    const normalizedPlanId = planIdValue || null;
    maybeAssign("plan_id", normalizedPlanId, org.plan_id ?? null);

    const billingAnchorRaw = getValue("billing_anchor_day");
    let billingAnchorDay: number | null = null;
    if (billingAnchorRaw) {
      const parsed = Number(billingAnchorRaw);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 28) {
        setMessage({ type: "error", content: "Billing anchor day must be between 1 and 28." });
        return;
      }
      billingAnchorDay = parsed;
    }
    maybeAssign("billing_anchor_day", billingAnchorDay, org.billing_anchor_day ?? null);

    const isProvider = formData.get("is_provider") === "on";
    const isBroker = formData.get("is_broker") === "on";
    const isActive = formData.get("active") === "on";

    maybeAssign("is_provider", isProvider, Boolean(org.is_provider));
    maybeAssign("is_broker", isBroker, Boolean(org.is_broker));
    maybeAssign("active", isActive, org.active ?? true);

    if (Object.keys(payload).length === 0) {
      setMessage({ type: "success", content: "No changes detected." });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const errorMessage =
          typeof result?.error === "string"
            ? result.error
            : "Unable to save organization. Please try again.";
        setMessage({ type: "error", content: errorMessage });
        return;
      }

      setMessage({ type: "success", content: "Organization updated." });
      router.push(`/owner/org/${org.id}`);
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        content: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name
          </label>
          <Input id="name" name="name" defaultValue={org.name} required />
        </div>

        <div className="space-y-2">
          <label htmlFor="legal_name" className="block text-sm font-medium text-foreground">
            Legal name
          </label>
          <Input id="legal_name" name="legal_name" defaultValue={org.legal_name ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="primary_email" className="block text-sm font-medium text-foreground">
            Primary email
          </label>
          <Input id="primary_email" name="primary_email" defaultValue={org.primary_email ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="primary_phone" className="block text-sm font-medium text-foreground">
            Primary phone
          </label>
          <Input id="primary_phone" name="primary_phone" defaultValue={org.primary_phone ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="address_line1" className="block text-sm font-medium text-foreground">
            Address line 1
          </label>
          <Input id="address_line1" name="address_line1" defaultValue={org.address_line1 ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="address_line2" className="block text-sm font-medium text-foreground">
            Address line 2
          </label>
          <Input id="address_line2" name="address_line2" defaultValue={org.address_line2 ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="block text-sm font-medium text-foreground">
            City
          </label>
          <Input id="city" name="city" defaultValue={org.city ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="state" className="block text-sm font-medium text-foreground">
            State
          </label>
          <select
            id="state"
            name="state"
            defaultValue={org.state ?? ""}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
          <Input id="zip_code" name="zip_code" defaultValue={org.zip_code ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="country" className="block text-sm font-medium text-foreground">
            Country
          </label>
          <Input id="country" name="country" defaultValue={org.country ?? ""} />
        </div>

        <div className="space-y-2">
          <label htmlFor="plan_id" className="block text-sm font-medium text-foreground">
            Subscription plan
          </label>
          <select
            id="plan_id"
            name="plan_id"
            defaultValue={org.plan_id ?? ""}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">No plan (custom)</option>
            {planOptions.map((plan) => (
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
            defaultValue={org.billing_anchor_day ?? ""}
            placeholder="1-28"
          />
          <p className="text-xs text-muted-foreground">
            Optional. Aligns billing cycles to a fixed day of the month.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="is_provider"
            defaultChecked={Boolean(org.is_provider)}
            className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
          />
          Provider
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="is_broker"
            defaultChecked={Boolean(org.is_broker)}
            className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
          />
          Broker
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={org.active ?? true}
            className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
          />
          Active
        </label>
      </div>

      {message && (
        <p
          className={
            message.type === "error"
              ? "text-sm text-destructive"
              : "text-sm text-emerald-600"
          }
        >
          {message.content}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() => router.push(`/owner/org/${org.id}`)}
        >
          Discard
        </Button>
      </div>
    </form>
  );
}
