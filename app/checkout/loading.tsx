import { StoreShell } from "@/components/store/store-shell";
import { CheckoutSkeleton } from "@/components/store/store-skeletons";

export default function CheckoutLoading() {
  return (
    <StoreShell>
      <CheckoutSkeleton />
    </StoreShell>
  );
}
