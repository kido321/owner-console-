"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  created_at: string | null;
}

interface PlanFeature {
  plan_id: string;
  feature_key: string;
  value: string;
  enforced: boolean | null;
}

interface FeatureDefinition {
  key: string;
  name: string;
  description: string | null;
  ftype: string;
  default_value: string | null;
  unit: string | null;
  is_metered: boolean | null;
}

interface PlansManagerProps {
  plans: Plan[];
  planFeatures: PlanFeature[];
  featureDefinitions: FeatureDefinition[];
}

interface FeatureState {
  value: string;
  enforced: boolean;
}

export default function PlansManager({ plans, planFeatures, featureDefinitions }: PlansManagerProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingFeatures, startSavingFeatures] = useTransition();
  const [isRenaming, startRenaming] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id ?? null);

  const initialPlanNames = useMemo(() => {
    const result: Record<string, string> = {};
    for (const plan of plans) {
      result[plan.id] = plan.name;
    }
    return result;
  }, [plans]);

  const [planNames, setPlanNames] = useState<Record<string, string>>(initialPlanNames);

  useEffect(() => {
    setPlanNames(initialPlanNames);
  }, [initialPlanNames]);

  const initialFeatureState = useMemo(() => {
    const state: Record<string, Record<string, FeatureState>> = {};

    for (const plan of plans) {
      state[plan.id] = {};
      for (const feature of featureDefinitions) {
        state[plan.id][feature.key] = {
          value: "",
          enforced: true,
        };
      }
    }

    for (const feature of planFeatures) {
      if (!state[feature.plan_id]) {
        state[feature.plan_id] = {};
      }
      state[feature.plan_id][feature.feature_key] = {
        value: feature.value ?? "",
        enforced: feature.enforced ?? true,
      };
    }

    return state;
  }, [plans, planFeatures, featureDefinitions]);

  const [featureState, setFeatureState] = useState<Record<string, Record<string, FeatureState>>>(
    initialFeatureState
  );

  useEffect(() => {
    setFeatureState(initialFeatureState);
  }, [initialFeatureState]);

  const selectedPlan = selectedPlanId ? plans.find((plan) => plan.id === selectedPlanId) : null;
  const selectedFeatures = selectedPlanId ? featureState[selectedPlanId] ?? {} : {};

  async function handleCreatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("id")?.toString().trim() ?? "";
    const name = formData.get("name")?.toString().trim() ?? "";

    if (!id || !name) {
      setCreateError("Plan id and name are required");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const message =
          typeof result?.error === "string"
            ? result.error
            : "Unable to create plan. Please review the fields and try again.";
        setCreateError(message);
        return;
      }

      form.reset();
      setSelectedPlanId(id);
      router.refresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Something went wrong while creating plan");
    } finally {
      setIsCreating(false);
    }
  }

  function onFeatureValueChange(featureKey: string, value: string) {
    if (!selectedPlanId) return;
    setFeatureState((prev) => ({
      ...prev,
      [selectedPlanId]: {
        ...(prev[selectedPlanId] ?? {}),
        [featureKey]: {
          value,
          enforced: prev[selectedPlanId]?.[featureKey]?.enforced ?? true,
        },
      },
    }));
  }

  function onFeatureEnforcedChange(featureKey: string, enforced: boolean) {
    if (!selectedPlanId) return;
    setFeatureState((prev) => ({
      ...prev,
      [selectedPlanId]: {
        ...(prev[selectedPlanId] ?? {}),
        [featureKey]: {
          value: prev[selectedPlanId]?.[featureKey]?.value ?? "",
          enforced,
        },
      },
    }));
  }

  function resetFeaturesToBlank() {
    if (!selectedPlanId) return;
    setFeatureState((prev) => ({
      ...prev,
      [selectedPlanId]: featureDefinitions.reduce<Record<string, FeatureState>>((acc, feature) => {
        acc[feature.key] = { value: "", enforced: true };
        return acc;
      }, {}),
    }));
  }

  function restoreFeaturesFromDefaults() {
    if (!selectedPlanId) return;
    setFeatureState((prev) => ({
      ...prev,
      [selectedPlanId]: featureDefinitions.reduce<Record<string, FeatureState>>((acc, feature) => {
        const current = prev[selectedPlanId]?.[feature.key];
        acc[feature.key] = {
          value: current?.value ?? feature.default_value ?? "",
          enforced: current?.enforced ?? true,
        };
        return acc;
      }, {}),
    }));
  }

  function handleSaveFeatures() {
    if (!selectedPlanId) return;
    startSavingFeatures(async () => {
      const featuresPayload = Object.entries(featureState[selectedPlanId] ?? {})
        .filter(([, data]) => data.value.trim().length > 0)
        .map(([featureKey, data]) => ({
          feature_key: featureKey,
          value: data.value.trim(),
          enforced: data.enforced,
        }));

      try {
        const response = await fetch(`/api/plans/${selectedPlanId}/features`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ features: featuresPayload }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          const message =
            typeof result?.error === "string"
              ? result.error
              : "Unable to save plan features. Please try again.";
          alert(message);
          return;
        }

        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Unable to save plan features");
      }
    });
  }

  function handleRenamePlan() {
    if (!selectedPlanId) return;
    const name = planNames[selectedPlanId]?.trim();
    if (!name) {
      alert("Plan name cannot be empty");
      return;
    }

    startRenaming(async () => {
      try {
        const response = await fetch(`/api/plans/${selectedPlanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          const message =
            typeof result?.error === "string" ? result.error : "Unable to update plan name. Please try again.";
          alert(message);
          return;
        }

        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Unable to update plan name");
      }
    });
  }

  function handleDeletePlan() {
    if (!selectedPlanId) return;
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    const confirmed = confirm(`Delete plan "${plan.name}"? This cannot be undone.`);
    if (!confirmed) return;

    startDeleting(async () => {
      try {
        const response = await fetch(`/api/plans/${selectedPlanId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          const message =
            typeof result?.error === "string" ? result.error : "Unable to delete plan. Please try again.";
          alert(message);
          return;
        }

        setSelectedPlanId((prev) => {
          if (prev === selectedPlanId) {
            const remaining = plans.filter((p) => p.id !== selectedPlanId);
            return remaining[0]?.id ?? null;
          }
          return prev;
        });

        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Unable to delete plan");
      }
    });
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Plans</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create subscription plans, assign pricing features, and control enforcement rules that apply to tenant
          organizations.
        </p>

        <form onSubmit={handleCreatePlan} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="plan-id" className="text-sm font-medium text-foreground">
              Plan id
            </label>
            <Input id="plan-id" name="id" placeholder="growth" required autoComplete="off" />
          </div>
          <div className="space-y-2">
            <label htmlFor="plan-name" className="text-sm font-medium text-foreground">
              Plan name
            </label>
            <Input id="plan-name" name="name" placeholder="Growth" required autoComplete="off" />
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating…" : "Create plan"}
          </Button>
          {createError && <p className="md:col-span-3 text-sm text-destructive">{createError}</p>}
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-medium text-muted-foreground">Plan catalog</h2>
            <div className="mt-4 space-y-2">
              {plans.length === 0 && (
                <p className="text-sm text-muted-foreground">No plans yet. Create one to get started.</p>
              )}
              {plans.map((plan) => {
                const isActive = plan.id === selectedPlanId;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      isActive ? "border-foreground bg-accent" : "border-transparent bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{plan.name}</span>
                      {isActive && <Badge variant="outline">Selected</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{plan.id}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {selectedPlan && (
            <section className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Plan id
                  </div>
                  <div className="text-sm text-foreground">{selectedPlan.id}</div>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <label className="text-sm font-medium text-foreground">Plan name</label>
                  <Input
                    value={planNames[selectedPlan.id] ?? ""}
                    onChange={(event) =>
                      setPlanNames((prev) => ({ ...prev, [selectedPlan.id]: event.target.value }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={handleRenamePlan} disabled={isRenaming}>
                      {isRenaming ? "Saving…" : "Save name"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeletePlan}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Plan features</h3>
                    <p className="text-sm text-muted-foreground">
                      Leave a value empty to inherit from the catalog default. Toggle enforcement to control whether
                      tenants can override the feature.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={restoreFeaturesFromDefaults}>
                      Load defaults
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetFeaturesToBlank}>
                      Clear all
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Feature</th>
                        <th className="px-4 py-2 text-left font-medium">Value</th>
                        <th className="px-4 py-2 text-left font-medium">Unit</th>
                        <th className="px-4 py-2 text-left font-medium">Enforced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureDefinitions.map((feature) => {
                        const state = selectedFeatures[feature.key] ?? { value: "", enforced: true };
                        return (
                          <tr key={feature.key} className="border-t">
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-foreground">{feature.name}</div>
                              <div className="text-xs text-muted-foreground">{feature.key}</div>
                              {feature.description && (
                                <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                              )}
                              {feature.default_value && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Default: <span className="font-medium">{feature.default_value}</span>
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <Input
                                value={state.value}
                                onChange={(event) => onFeatureValueChange(feature.key, event.target.value)}
                                placeholder={feature.default_value ?? "Inherit"}
                              />
                            </td>
                            <td className="px-4 py-3 align-top text-muted-foreground">
                              {feature.unit ?? "—"}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <label className="inline-flex items-center gap-2 text-xs text-foreground">
                                <input
                                  type="checkbox"
                                  checked={state.enforced}
                                  onChange={(event) => onFeatureEnforcedChange(feature.key, event.target.checked)}
                                  className="h-4 w-4 rounded border-input text-foreground focus:ring-foreground"
                                />
                                Enforced
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="button" onClick={handleSaveFeatures} disabled={isSavingFeatures}>
                    {isSavingFeatures ? "Saving…" : "Save plan features"}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {!selectedPlan && plans.length > 0 && (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              Select a plan from the left to configure pricing and features.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
