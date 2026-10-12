"use client";

import { Tag, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyCouponAction, removeCouponAction } from "@/app/actions/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponBoxProps {
  appliedCode: string | null;
  couponError?: string | null;
  discountMinor: number;
  email?: string;
}

export function CouponBox({
  appliedCode,
  couponError = null,
  discountMinor,
  email,
}: CouponBoxProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    setError(null);
    startTransition(async () => {
      const res = await applyCouponAction(code, email);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCode("");
      router.refresh();
    });
  };

  const handleRemove = () => {
    setError(null);
    startTransition(async () => {
      await removeCouponAction();
      router.refresh();
    });
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <Tag size={16} weight="bold" />
          <span className="font-mono font-bold">{appliedCode}</span>
          <span>
            applied · you save ₹{(discountMinor / 100).toLocaleString("en-IN")}
          </span>
        </div>
        <button
          aria-label="Remove coupon"
          className="text-muted-foreground hover:text-destructive"
          disabled={isPending}
          onClick={handleRemove}
          type="button"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    );
  }

  const message = error ?? couponError;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Input
          aria-label="Coupon code"
          className="text-xs uppercase"
          disabled={isPending}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="Coupon code"
          value={code}
        />
        <Button
          className="h-9 rounded-full text-2xs font-bold uppercase tracking-ui"
          disabled={isPending || !code.trim()}
          onClick={handleApply}
          type="button"
          variant="outline"
        >
          Apply
        </Button>
      </div>
      {message && <p className="text-2xs text-destructive">{message}</p>}
    </div>
  );
}
