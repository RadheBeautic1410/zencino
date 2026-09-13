import { StoreShell } from "@/components/store/store-shell";
import { ProductDetailSkeleton } from "@/components/store/store-skeletons";

export default function ProductDetailLoading() {
  return (
    <StoreShell>
      <ProductDetailSkeleton />
    </StoreShell>
  );
}
