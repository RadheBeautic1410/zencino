"use client";

import { Plus, Tag, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCouponAction, toggleCouponAction } from "@/app/actions/coupons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CouponTargetOptions,
  CouponWithUsage,
} from "@/lib/commerce/coupons";

interface Props {
  coupons: CouponWithUsage[];
  options: CouponTargetOptions;
}

type AppliesTo = "all" | "products" | "categories";

function CheckList({
  items,
  name,
  title,
}: {
  items: { id: string; name: string }[];
  name: string;
  title: string;
}) {
  const [filter, setFilter] = useState("");
  const term = filter.trim().toLowerCase();
  const visible = term
    ? items.filter((i) => i.name.toLowerCase().includes(term))
    : items;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </p>
      <Input
        aria-label={`Filter ${title}`}
        className="h-8 text-xs"
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search..."
        value={filter}
      />
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
        {items.length === 0 && (
          <p className="text-2xs text-muted-foreground">Nothing to select.</p>
        )}
        {items.map((item) => (
          <label
            className="flex items-center gap-2 text-xs"
            hidden={!visible.includes(item)}
            key={item.id}
          >
            <input name={name} type="checkbox" value={item.id} />
            <span className="truncate">{item.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function describeScope(entry: CouponWithUsage) {
  const { coupon, targets } = entry;
  if (coupon.appliesTo === "all") {
    return "All products";
  }
  const names = targets.map((t) => t.name);
  const shown = names.slice(0, 3).join(", ");
  const more = names.length > 3 ? ` +${names.length - 3} more` : "";
  const label =
    coupon.appliesTo === "products" ? "Products" : "Categories/collections";
  return `${label}: ${shown || "none selected"}${more}`;
}

const formatRupees = (minor: number) =>
  `₹${(minor / 100).toLocaleString("en-IN")}`;

const formatDate = (value: Date | string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

function describeDiscount(c: CouponWithUsage["coupon"]) {
  if (c.discountType === "fixed") {
    return `${formatRupees(c.discountValue)} off`;
  }
  const cap = c.maxDiscountMinor
    ? ` (up to ${formatRupees(c.maxDiscountMinor)})`
    : "";
  return `${c.discountValue}% off${cap}`;
}

function couponStatus(c: CouponWithUsage["coupon"]) {
  const now = Date.now();
  if (!c.active) {
    return { label: "Disabled", variant: "outline" as const };
  }
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) {
    return { label: "Expired", variant: "destructive" as const };
  }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) {
    return { label: "Scheduled", variant: "outline" as const };
  }
  return { label: "Active", variant: "secondary" as const };
}

export function CouponManager({ coupons, options }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent"
  );
  const [appliesTo, setAppliesTo] = useState<AppliesTo>("all");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("active", "true");

    startTransition(async () => {
      const res = await saveCouponAction(fd);
      if (res.success) {
        setShowForm(false);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to save coupon");
      }
    });
  };

  const handleToggle = (couponId: string, active: boolean) => {
    startTransition(async () => {
      await toggleCouponAction(couponId, active);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Discount Coupons</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Coupons discount the eligible items in the bag. Shipping and GST are
            calculated on the discounted amount.
          </p>
        </div>
        <Button className="gap-2 text-xs" onClick={() => setShowForm(true)}>
          <Plus size={14} /> New Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Tag className="mx-auto text-muted-foreground" size={40} />
          <h3 className="font-bold text-base">No coupons yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Create a code like WELCOME10 to offer customers a discount at
            checkout.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((entry) => {
            const { coupon: c, usedCount, discountGivenMinor } = entry;
            const status = couponStatus(c);
            return (
              <Card className="p-5" key={c.id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-black">
                        {c.code}
                      </span>
                      <Badge
                        className="text-2xs uppercase"
                        variant={status.variant}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold">
                      {describeDiscount(c)}
                      {c.minOrderMinor > 0 &&
                        ` · min order ${formatRupees(c.minOrderMinor)}`}
                    </p>
                    <p className="text-2xs font-semibold text-primary">
                      {describeScope(entry)}
                    </p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    <p className="text-2xs text-muted-foreground">
                      {formatDate(c.startsAt)
                        ? `From ${formatDate(c.startsAt)}`
                        : "No start date"}
                      {" · "}
                      {formatDate(c.expiresAt)
                        ? `Expires ${formatDate(c.expiresAt)}`
                        : "No expiry"}
                      {" · "}
                      {c.perCustomerLimit} use
                      {c.perCustomerLimit === 1 ? "" : "s"} per customer
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right text-xs">
                      <p className="font-bold">
                        {usedCount}
                        {c.usageLimit !== null && ` / ${c.usageLimit}`} used
                      </p>
                      <p className="text-muted-foreground">
                        {formatRupees(discountGivenMinor)} given
                      </p>
                    </div>
                    <Button
                      className="text-xs"
                      disabled={isPending}
                      onClick={() => handleToggle(c.id, !c.active)}
                      size="sm"
                      variant="outline"
                    >
                      {c.active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <form
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl my-8"
            onSubmit={handleSubmit}
          >
            <h3 className="font-heading text-lg font-bold">New Coupon</h3>

            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <WarningCircle className="shrink-0" size={16} />
                <p>{formError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold"
                htmlFor="coupon-code"
              >
                Code
              </label>
              <Input
                className="uppercase"
                id="coupon-code"
                maxLength={32}
                name="code"
                placeholder="WELCOME10"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold"
                htmlFor="coupon-description"
              >
                Description (optional)
              </label>
              <Input
                id="coupon-description"
                name="description"
                placeholder="10% off your first order"
              />
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold"
                htmlFor="coupon-appliesTo"
              >
                Applies to
              </label>
              <select
                className="h-10 w-full border-b border-input bg-transparent text-sm outline-none"
                id="coupon-appliesTo"
                name="appliesTo"
                onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}
                value={appliesTo}
              >
                <option value="all">All products</option>
                <option value="products">Specific products</option>
                <option value="categories">
                  Specific categories / collections
                </option>
              </select>
            </div>

            {appliesTo === "products" && (
              <CheckList
                items={options.products}
                name="productIds"
                title="Products"
              />
            )}
            {appliesTo === "categories" && (
              <div className="space-y-4">
                <CheckList
                  items={options.categories}
                  name="categoryIds"
                  title="Categories"
                />
                <CheckList
                  items={options.collections}
                  name="collectionIds"
                  title="Collections"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-discountType"
                >
                  Type
                </label>
                <select
                  className="h-10 w-full border-b border-input bg-transparent text-sm outline-none"
                  id="coupon-discountType"
                  name="discountType"
                  onChange={(e) =>
                    setDiscountType(e.target.value as "percent" | "fixed")
                  }
                  value={discountType}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-discountValue"
                >
                  {discountType === "percent" ? "Percent off" : "Rupees off"}
                </label>
                <Input
                  id="coupon-discountValue"
                  min={1}
                  name="discountValue"
                  required
                  step={1}
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-minOrder"
                >
                  Min order (₹)
                </label>
                <Input
                  defaultValue={0}
                  id="coupon-minOrder"
                  min={0}
                  name="minOrder"
                  step={1}
                  type="number"
                />
              </div>
              {discountType === "percent" && (
                <div className="space-y-1">
                  <label
                    className="block text-xs font-semibold"
                    htmlFor="coupon-maxDiscount"
                  >
                    Max discount cap (₹, optional)
                  </label>
                  <Input
                    id="coupon-maxDiscount"
                    min={1}
                    name="maxDiscount"
                    step={1}
                    type="number"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-startsAt"
                >
                  Starts (optional)
                </label>
                <Input
                  id="coupon-startsAt"
                  name="startsAt"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-expiresAt"
                >
                  Expires (optional)
                </label>
                <Input
                  id="coupon-expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-usageLimit"
                >
                  Total usage limit (optional)
                </label>
                <Input
                  id="coupon-usageLimit"
                  min={1}
                  name="usageLimit"
                  step={1}
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold"
                  htmlFor="coupon-perCustomerLimit"
                >
                  Uses per customer
                </label>
                <Input
                  defaultValue={1}
                  id="coupon-perCustomerLimit"
                  min={1}
                  name="perCustomerLimit"
                  step={1}
                  type="number"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                className="text-xs"
                onClick={() => setShowForm(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="text-xs" disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save Coupon"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
