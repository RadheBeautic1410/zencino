import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { StoreShell } from "@/components/store/store-shell";
import { getCurrentSession } from "@/lib/authz";
import { getCartDetails } from "@/lib/commerce/cart";
import { getCartPricing } from "@/lib/commerce/coupons";

export const metadata: Metadata = {
  title: "Shopping Bag - Zencino",
  description:
    "Review items in your Zencino shopping bag before proceeding to delivery checkout.",
};

export default async function CartPage() {
  const [cart, session] = await Promise.all([
    getCartDetails(),
    getCurrentSession(),
  ]);
  const pricing = await getCartPricing(cart, {
    userId: session?.user?.id,
    email: session?.user?.email,
  });

  return (
    <StoreShell>
      <CartView cart={cart} pricing={pricing} />
    </StoreShell>
  );
}
