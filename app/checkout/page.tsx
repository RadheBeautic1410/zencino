import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/store/checkout-view";
import { StoreShell } from "@/components/store/store-shell";
import { getCartDetails } from "@/lib/commerce/cart";
import { getCartPricing } from "@/lib/commerce/coupons";

export const metadata: Metadata = {
  title: "Checkout & Delivery",
  description:
    "Provide shipping details and generate a verified checkout quote for your Zencino order.",
};

import { getCurrentSession } from "@/lib/authz";
import { getCustomerAddresses } from "@/lib/commerce/customer-account";

export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([
    getCartDetails(),
    getCurrentSession(),
  ]);

  if (!cart.cartId || cart.items.length === 0) {
    redirect("/cart");
  }

  const savedAddresses = session?.user?.id
    ? await getCustomerAddresses(session.user.id)
    : [];
  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;

  const pricing = await getCartPricing(
    cart,
    {
      userId: session?.user?.id,
      email: session?.user?.email,
    },
    defaultAddress?.postcode
  );

  return (
    <StoreShell>
      <CheckoutView
        cart={cart}
        initialEmail={session?.user?.email || ""}
        initialName={session?.user?.name || ""}
        isLoggedIn={Boolean(session?.user)}
        pricing={pricing}
        savedAddresses={savedAddresses}
      />
    </StoreShell>
  );
}
