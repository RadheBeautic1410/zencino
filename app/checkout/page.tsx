import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/store/checkout-view";
import { StoreShell } from "@/components/store/store-shell";
import { getCartDetails } from "@/lib/commerce/cart";

export const metadata: Metadata = {
  title: "Checkout & Delivery - Zencino",
  description: "Provide shipping details and generate a verified checkout quote for your Zencino order.",
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

  return (
    <StoreShell>
      <CheckoutView
        cart={cart}
        initialEmail={session?.user?.email || ""}
        initialName={session?.user?.name || ""}
        savedAddresses={savedAddresses}
        isLoggedIn={Boolean(session?.user)}
      />
    </StoreShell>
  );
}
