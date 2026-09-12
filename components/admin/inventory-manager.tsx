"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  ClockCounterClockwise,
  MagnifyingGlass,
  Warning,
  X,
} from "@phosphor-icons/react";
import { adjustStockAction } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export interface VariantStockItem {
  variantId: string;
  sku: string;
  title: string;
  priceMinor: number | null;
  active: boolean;
  productId: string;
  productName: string;
  productSlug: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  locationId: string;
  isLowStock: boolean;
}

export interface StockMovementItem {
  id: string;
  variantId: string;
  onHandDelta: number;
  reservedDelta: number;
  reason: string;
  referenceType: string | null;
  createdAt: Date | null;
  sku: string;
  variantTitle: string;
}

interface InventoryManagerProps {
  variants: VariantStockItem[];
  movements: StockMovementItem[];
}

export function InventoryManager({ variants, movements }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "ok">("all");
  const [selectedVariant, setSelectedVariant] = useState<VariantStockItem | null>(null);

  // Adjustment Modal State
  const [adjustmentMode, setAdjustmentMode] = useState<"add" | "remove">("add");
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics summary
  const totalOnHand = useMemo(() => variants.reduce((sum, v) => sum + v.onHand, 0), [variants]);
  const totalReserved = useMemo(() => variants.reduce((sum, v) => sum + v.reserved, 0), [variants]);
  const totalAvailable = useMemo(() => variants.reduce((sum, v) => sum + v.available, 0), [variants]);
  const lowStockCount = useMemo(() => variants.filter((v) => v.available > 0 && v.available <= v.reorderLevel).length, [variants]);
  const outOfStockCount = useMemo(() => variants.filter((v) => v.available === 0).length, [variants]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const matchesSearch =
        v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.title.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "low") return v.available > 0 && v.available <= v.reorderLevel;
      if (filter === "out") return v.available === 0;
      if (filter === "ok") return v.available > v.reorderLevel;
      return true;
    });
  }, [variants, searchTerm, filter]);

  const handleOpenAdjustment = (v: VariantStockItem) => {
    setSelectedVariant(v);
    setAdjustmentMode("add");
    setAdjustmentQty(10);
    setAdjustmentReason("Shipment received");
    setAdjustmentError(null);
  };

  const handleCloseAdjustment = () => {
    setSelectedVariant(null);
    setAdjustmentError(null);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    if (!adjustmentQty || adjustmentQty <= 0) {
      setAdjustmentError("Please enter a valid positive quantity");
      return;
    }

    if (!adjustmentReason.trim()) {
      setAdjustmentError("A reason is mandatory for all inventory adjustments");
      return;
    }

    const delta = adjustmentMode === "add" ? adjustmentQty : -adjustmentQty;

    const formData = new FormData();
    formData.append("variantId", selectedVariant.variantId);
    formData.append("onHandDelta", String(delta));
    formData.append("reason", adjustmentReason.trim());

    startTransition(async () => {
      setAdjustmentError(null);
      const res = await adjustStockAction(formData);
      if (res.error) {
        setAdjustmentError(res.error);
      } else {
        handleCloseAdjustment();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{variants.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Total On Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{totalOnHand.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Total Reserved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {totalReserved.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Total Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalAvailable.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Low / Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {outOfStockCount}
              </span>
              <span className="text-xs text-muted-foreground">
                out ({lowStockCount} low)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Table Card */}
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold">Variant Stock Levels</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Physical counts, customer reservations, and replenishment thresholds.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilter("all")}
              >
                All ({variants.length})
              </Button>
              <Button
                variant={filter === "ok" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilter("ok")}
              >
                In Stock ({variants.length - lowStockCount - outOfStockCount})
              </Button>
              <Button
                variant={filter === "low" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilter("low")}
              >
                Low Stock ({lowStockCount})
              </Button>
              <Button
                variant={filter === "out" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilter("out")}
              >
                Out of Stock ({outOfStockCount})
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <MagnifyingGlass className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <Input
              type="text"
              placeholder="Filter by product name, variant title, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    No product variants match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((v) => {
                  const isOutOfStock = v.available === 0;
                  const isLow = v.available > 0 && v.available <= v.reorderLevel;

                  return (
                    <TableRow key={v.variantId}>
                      <TableCell className="max-w-xs">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {v.productName}
                        </div>
                        <div className="text-2xs text-muted-foreground truncate">
                          {v.title}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold">
                        {v.sku}
                      </TableCell>

                      <TableCell className="text-right text-xs">
                        {v.priceMinor ? `₹${(v.priceMinor / 100).toLocaleString("en-IN")}` : "—"}
                      </TableCell>

                      <TableCell className="text-right font-medium text-xs">
                        {v.onHand.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell className="text-right text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {v.reserved > 0 ? v.reserved.toLocaleString("en-IN") : "0"}
                      </TableCell>

                      <TableCell className="text-right font-bold text-xs text-foreground">
                        {v.available.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell className="text-center">
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="text-2xs uppercase">
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="text-2xs uppercase border-amber-500 text-amber-600 dark:text-amber-400">
                            Low ({v.available})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs uppercase text-emerald-600 dark:text-emerald-400">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold"
                            onClick={() => handleOpenAdjustment(v)}
                          >
                            Adjust
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2" title="Edit in Catalog">
                            <Link href={`/admin/products/${v.productId}?tab=variants`}>
                              <ArrowSquareOut size={14} />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={handleCloseAdjustment}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-black tracking-tight">Adjust Stock Balance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedVariant.productName} · <span className="font-semibold">{selectedVariant.title}</span> ({selectedVariant.sku})
              </p>
            </div>

            {/* Current Metrics */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/40 p-3 mb-5 text-center text-xs">
              <div>
                <span className="text-2xs uppercase tracking-ui text-muted-foreground block">On Hand</span>
                <span className="text-base font-bold">{selectedVariant.onHand}</span>
              </div>
              <div>
                <span className="text-2xs uppercase tracking-ui text-muted-foreground block">Reserved</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{selectedVariant.reserved}</span>
              </div>
              <div>
                <span className="text-2xs uppercase tracking-ui text-muted-foreground block">Available</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{selectedVariant.available}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              {/* Add vs Remove toggle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-ui text-muted-foreground block mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode("add")}
                    className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-xs font-bold transition-all ${
                      adjustmentMode === "add"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowUp size={16} weight="bold" />
                    <span>Receive / Add Stock (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentMode("remove")}
                    className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-xs font-bold transition-all ${
                      adjustmentMode === "remove"
                        ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowDown size={16} weight="bold" />
                    <span>Deduct / Write-off (-)</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold uppercase tracking-ui text-muted-foreground block mb-1.5">
                  Units to {adjustmentMode === "add" ? "Add" : "Remove"}
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="font-bold text-base"
                  required
                />
                <p className="mt-1 text-2xs text-muted-foreground">
                  New on hand will be:{" "}
                  <span className="font-bold text-foreground">
                    {adjustmentMode === "add"
                      ? selectedVariant.onHand + adjustmentQty
                      : selectedVariant.onHand - adjustmentQty}
                  </span>{" "}
                  units (Available:{" "}
                  <span className="font-bold text-foreground">
                    {Math.max(
                      0,
                      (adjustmentMode === "add"
                        ? selectedVariant.onHand + adjustmentQty
                        : selectedVariant.onHand - adjustmentQty) - selectedVariant.reserved
                    )}
                  </span>
                  )
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold uppercase tracking-ui text-muted-foreground block mb-1.5">
                  Reason for Adjustment <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Shipment received PO-2026, Defective write-off, Cycle count audit"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="text-xs"
                  required
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Shipment received",
                    "Cycle count adjustment",
                    "Damaged / Defective write-off",
                    "Customer return restocked",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustmentReason(preset)}
                      className="rounded bg-muted px-2 py-0.5 text-2xs text-muted-foreground hover:text-foreground"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {adjustmentError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 border border-destructive/30 p-3 text-xs font-medium text-destructive">
                  <Warning size={16} />
                  <span>{adjustmentError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAdjustment}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="min-w-28"
                >
                  {isPending ? "Updating..." : "Confirm Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Audit Log */}
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ClockCounterClockwise size={18} className="text-muted-foreground" />
            <CardTitle className="text-base font-bold">Recent Stock Movement Audit</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of all physical stock changes, order reservations, and inventory adjustments.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Variant / SKU</TableHead>
                <TableHead className="text-right">On Hand Change</TableHead>
                <TableHead className="text-right">Reserved Change</TableHead>
                <TableHead>Reason / Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No inventory movements recorded yet. Adjustments will appear here automatically.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {m.createdAt ? formatDateTime(m.createdAt) : "—"}
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {m.variantTitle}
                      </div>
                      <div className="font-mono text-2xs text-muted-foreground">
                        {m.sku}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs">
                      {m.onHandDelta > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{m.onHandDelta}
                        </span>
                      ) : m.onHandDelta < 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {m.onHandDelta}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs">
                      {m.reservedDelta > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          +{m.reservedDelta}
                        </span>
                      ) : m.reservedDelta < 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {m.reservedDelta}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-medium text-foreground">{m.reason}</span>
                      {m.referenceType && (
                        <span className="ml-2 text-2xs text-muted-foreground uppercase">
                          ({m.referenceType})
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
