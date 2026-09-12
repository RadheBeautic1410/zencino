import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/store/checkout-view";
import { StoreShell } from "@/components/store/store-shell";
import { getCartDetails } from "@/lib/commerce/cart";

export const metadata: Metadata = {
  title: "Checkout & Delivery - Zencino",
  description: "Provide shipping details and generate a verified checkout quote for your Zencino order.",
};

export default async function CheckoutPage() {
  const cart = await getCartDetails();

  if (!cart.cartId || cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <StoreShell>
      <CheckoutView cart={cart} />
    </StoreShell>
  );
}
