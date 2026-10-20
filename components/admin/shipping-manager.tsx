"use client";

import { Plus, Truck, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteShippingRateAction,
  saveShippingRateAction,
  type ShippingTestResult,
  testShippingRateAction,
} from "@/app/actions/shipping";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ShippingPincodeRate } from "@/db/schema";

const formatRupees = (minor: number) =>
  `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const TYPE_LABEL: Record<ShippingPincodeRate["type"], string> = {
  exact: "Exact PIN",
  range: "PIN range",
  wildcard: "Wildcard",
};

export function ShippingManager({ rates }: { rates: ShippingPincodeRate[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ShippingPincodeRate | "new" | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [testPin, setTestPin] = useState("");
  const [testWeight, setTestWeight] = useState("1000");
  const [testResult, setTestResult] = useState<ShippingTestResult | null>(null);

  const term = filter.trim().toLowerCase();
  const visible = term
    ? rates.filter(
        (r) =>
          r.pincode.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term)
      )
    : rates;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    if (editing && editing !== "new") {
      fd.set("id", editing.id);
    }
    startTransition(async () => {
      const res = await saveShippingRateAction(fd);
      if (res.success) {
        setEditing(null);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to save shipping rate");
      }
    });
  };

  const handleToggle = (rate: ShippingPincodeRate) => {
    const fd = new FormData();
    fd.set("id", rate.id);
    fd.set("pincode", rate.pincode);
    fd.set("rate", String(rate.rateMinor / 100));
    fd.set("description", rate.description ?? "");
    fd.set("active", String(!rate.active));
    startTransition(async () => {
      await saveShippingRateAction(fd);
      router.refresh();
    });
  };

  const handleDelete = (rate: ShippingPincodeRate) => {
    if (!window.confirm(`Delete shipping rate for ${rate.pincode}?`)) {
      return;
    }
    startTransition(async () => {
      await deleteShippingRateAction(rate.id);
      router.refresh();
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      setTestResult(
        await testShippingRateAction(testPin, Number(testWeight) || 0)
      );
    });
  };

  const current = editing && editing !== "new" ? editing : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Shipping Rates</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Rate is charged per kg, rounded up (minimum 1 kg). Exact PINs win
            over ranges, ranges over wildcards. Unmatched PIN codes use ₹60/kg.
            Orders above the free-shipping threshold ship free.
          </p>
        </div>
        <Button className="gap-2 text-xs" onClick={() => setEditing("new")}>
          <Plus size={14} /> Add Rate
        </Button>
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-bold">Test a PIN code</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="space-y-1">
            <label className="block text-xs font-semibold" htmlFor="test-pin">
              PIN code
            </label>
            <Input
              id="test-pin"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setTestPin(e.target.value)}
              placeholder="364001"
              value={testPin}
            />
          </div>
          <div className="space-y-1">
            <label
              className="block text-xs font-semibold"
              htmlFor="test-weight"
            >
              Weight (grams)
            </label>
            <Input
              id="test-weight"
              inputMode="numeric"
              onChange={(e) => setTestWeight(e.target.value)}
              value={testWeight}
            />
          </div>
          <Button
            className="text-xs"
            disabled={isPending}
            onClick={handleTest}
            variant="outline"
          >
            Calculate
          </Button>
        </div>
        {testResult && (
          <p
            className={`text-xs font-semibold ${
              testResult.error ? "text-destructive" : "text-foreground"
            }`}
          >
            {testResult.error
              ? testResult.error
              : `${formatRupees(testResult.chargeMinor ?? 0)} (${formatRupees(
                  testResult.ratePerKgMinor ?? 0
                )}/kg · ${
                  testResult.isDefaultRate
                    ? "default rate, no match"
                    : `matched ${testResult.matchedPincode}`
                })`}
          </p>
        )}
      </Card>

      {rates.length > 0 && (
        <Input
          aria-label="Filter shipping rates"
          className="max-w-xs"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search PIN or description..."
          value={filter}
        />
      )}

      {rates.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Truck className="mx-auto text-muted-foreground" size={40} />
          <h3 className="font-bold text-base">No shipping rates yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Every order currently uses the default ₹60/kg rate. Add a rate such
            as 364001, 364001-364005 or 36* to override it.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => (
            <Card className="p-4" key={r.id}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-black">
                      {r.pincode}
                    </span>
                    <Badge className="text-2xs uppercase" variant="outline">
                      {TYPE_LABEL[r.type]}
                    </Badge>
                    <Badge
                      className="text-2xs uppercase"
                      variant={r.active ? "secondary" : "outline"}
                    >
                      {r.active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatRupees(r.rateMinor)} / kg
                  </p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="text-xs"
                    disabled={isPending}
                    onClick={() => setEditing(r)}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    className="text-xs"
                    disabled={isPending}
                    onClick={() => handleToggle(r)}
                    size="sm"
                    variant="outline"
                  >
                    {r.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    className="text-xs"
                    disabled={isPending}
                    onClick={() => handleDelete(r)}
                    size="sm"
                    variant="outline"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <form
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl my-8"
            key={current?.id ?? "new"}
            onSubmit={handleSubmit}
          >
            <h3 className="font-heading text-lg font-bold">
              {current ? "Edit Shipping Rate" : "New Shipping Rate"}
            </h3>

            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <WarningCircle className="shrink-0" size={16} />
                <p>{formError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold"
                htmlFor="ship-pincode"
              >
                PIN code / range / wildcard
              </label>
              <Input
                defaultValue={current?.pincode ?? ""}
                id="ship-pincode"
                maxLength={13}
                name="pincode"
                placeholder="364001, 364001-364005 or 36*"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold" htmlFor="ship-rate">
                Rate per kg (₹)
              </label>
              <Input
                defaultValue={current ? String(current.rateMinor / 100) : ""}
                id="ship-rate"
                inputMode="decimal"
                name="rate"
                placeholder="60"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold"
                htmlFor="ship-description"
              >
                Description (optional)
              </label>
              <Input
                defaultValue={current?.description ?? ""}
                id="ship-description"
                name="description"
                placeholder="Gujarat - Zone A"
              />
            </div>

            <input
              name="active"
              type="hidden"
              value={String(current?.active ?? true)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                className="text-xs"
                disabled={isPending}
                onClick={() => {
                  setEditing(null);
                  setFormError(null);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="text-xs" disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save Rate"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
