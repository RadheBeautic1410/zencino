import { CouponManager } from "@/components/admin/coupon-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import {
  listCouponsWithUsage,
  listCouponTargetOptions,
} from "@/lib/commerce/coupons";

export const metadata = {
  title: "Coupons - Zencino Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [coupons, options] = await Promise.all([
    listCouponsWithUsage(),
    listCouponTargetOptions(),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Create discount codes, choose which products they apply to, set limits and expiry, and track usage."
        eyebrow="Marketing Operations"
        title="Coupons & Discounts"
      />

      <CouponManager coupons={coupons} options={options} />
    </div>
  );
}
