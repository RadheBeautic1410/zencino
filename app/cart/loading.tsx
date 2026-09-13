import { StoreShell } from "@/components/store/store-shell";
import { CartSkeleton } from "@/components/store/store-skeletons";

export default function CartLoading() {
  return (
    <StoreShell>
      <CartSkeleton />
    </StoreShell>
  );
}
