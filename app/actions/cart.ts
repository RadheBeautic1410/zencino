"use server";

import { revalidatePath } from "next/cache";
import { addItemToCart, getCartDetails, removeCartItem, updateCartItemQuantity } from "@/lib/commerce/cart";

export interface CartActionResult {
  success?: boolean;
  error?: string;
  totalItems?: number;
}

export async function addToCartAction(variantId: string, quantity = 1): Promise<CartActionResult> {
  try {
    await addItemToCart(variantId, quantity);
    const cart = await getCartDetails();

    revalidatePath("/cart");
    revalidatePath("/products");
    return { success: true, totalItems: cart.totalItems };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to add item to bag";
    return { error: msg };
  }
}

export async function updateQuantityAction(itemId: string, quantity: number): Promise<CartActionResult> {
  try {
    await updateCartItemQuantity(itemId, quantity);
    const cart = await getCartDetails();

    revalidatePath("/cart");
    return { success: true, totalItems: cart.totalItems };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update quantity";
    return { error: msg };
  }
}

export async function removeItemAction(itemId: string): Promise<CartActionResult> {
  try {
    await removeCartItem(itemId);
    const cart = await getCartDetails();

    revalidatePath("/cart");
    return { success: true, totalItems: cart.totalItems };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to remove item";
    return { error: msg };
  }
}
