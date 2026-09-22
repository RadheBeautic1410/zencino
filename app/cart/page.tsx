import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { StoreShell } from "@/components/store/store-shell";
import { getCartDetails } from "@/lib/commerce/cart";

export const metadata: Metadata = {
  title: "Shopping Bag - Zencino",
  description:
    "Review items in your Zencino shopping bag before proceeding to delivery checkout.",
};

export default async function CartPage() {
  const cart = await getCartDetails();

  return (
    <StoreShell>
      <CartView cart={cart} />
    </StoreShell>
  );
}
