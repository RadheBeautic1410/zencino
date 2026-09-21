import { getMediaAssetUrl } from "@/lib/media/url";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  cartItems,
  carts,
  mediaAssets,
  productMedia,
  products,
  productVariants,
  variantChannels,
} from "@/db/schema";
import { getCurrentSession } from "@/lib/authz";
import { getVariantStock } from "@/lib/commerce/inventory";
import { db } from "@/lib/db";
import { hashGuestToken } from "./rules";

export { hashGuestToken };

const CART_COOKIE_NAME = "zencino_cart";
const GUEST_CART_EXPIRY_DAYS = 30;

export async function getOrCreateCartId(): Promise<{ cartId: string; cookieToSet?: { name: string; value: string; maxAge: number } }> {
  const cookieStore = await cookies();
  const session = await getCurrentSession();

  // If user is logged in, find or create their account cart
  if (session?.user?.id) {
    let [userCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, session.user.id))
      .limit(1);

    if (!userCart) {
      [userCart] = await db
        .insert(carts)
        .values({
          userId: session.user.id,
          currency: "INR",
        })
        .returning({ id: carts.id });
    }

    return { cartId: userCart.id };
  }

  // Anonymous guest
  const existingCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (existingCookie) {
    const tokenHash = hashGuestToken(existingCookie);
    const [guestCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.guestTokenHash, tokenHash))
      .limit(1);

    if (guestCart) {
      return { cartId: guestCart.id };
    }
  }

  // Create new guest cart
  const rawToken = randomUUID();
  const tokenHash = hashGuestToken(rawToken);
  const expiresAt = new Date(Date.now() + GUEST_CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const [newCart] = await db
    .insert(carts)
    .values({
      guestTokenHash: tokenHash,
      currency: "INR",
      expiresAt,
    })
    .returning({ id: carts.id });

  return {
    cartId: newCart.id,
    cookieToSet: {
      name: CART_COOKIE_NAME,
      value: rawToken,
      maxAge: GUEST_CART_EXPIRY_DAYS * 24 * 60 * 60,
    },
  };
}

export async function addItemToCart(variantId: string, quantity = 1) {
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  // Validate variant exists and has website channel enabled
  const [variant] = await db
    .select({
      id: productVariants.id,
      active: productVariants.active,
      priceMinor: productVariants.priceMinor,
      title: productVariants.title,
    })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant || !variant.active || variant.priceMinor === null) {
    throw new Error("This item is not available for purchase on the website.");
  }

  const [channel] = await db
    .select({ enabled: variantChannels.enabled })
    .from(variantChannels)
    .where(
      and(
        eq(variantChannels.variantId, variantId),
        eq(variantChannels.channel, "website")
      )
    )
    .limit(1);

  if (!channel?.enabled) {
    throw new Error("Direct website ordering is not enabled for this item.");
  }

  // Check available stock
  const stock = await getVariantStock(variantId);
  if (stock.available < quantity) {
    throw new Error(
      stock.available === 0
        ? "This item is currently out of stock."
        : `Only ${stock.available} unit(s) currently available in stock.`
    );
  }

  const { cartId, cookieToSet } = await getOrCreateCartId();
  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: cookieToSet.maxAge,
      path: "/",
    });
  }

  // Check if item already in cart
  const [existingItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.variantId, variantId)
      )
    )
    .limit(1);

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > stock.available) {
      throw new Error(`Cannot add more. Maximum available stock is ${stock.available}.`);
    }

    await db
      .update(cartItems)
      .set({
        quantity: newQuantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existingItem.id));
  } else {
    await db.insert(cartItems).values({
      cartId,
      variantId,
      quantity,
    });
  }

  return { success: true };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(itemId);
  }

  const [item] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, itemId))
    .limit(1);

  if (!item) throw new Error("Item not found in cart");

  const stock = await getVariantStock(item.variantId);
  if (quantity > stock.available) {
    throw new Error(`Only ${stock.available} unit(s) available in stock.`);
  }

  await db
    .update(cartItems)
    .set({
      quantity,
      updatedAt: new Date(),
    })
    .where(eq(cartItems.id, itemId));

  return { success: true };
}

export async function removeCartItem(itemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  return { success: true };
}

export async function getCartDetails() {
  const cookieStore = await cookies();
  const session = await getCurrentSession();

  let cartId: string | null = null;

  if (session?.user?.id) {
    const [userCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, session.user.id))
      .limit(1);
    if (userCart) cartId = userCart.id;
  }

  if (!cartId) {
    const guestCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    if (guestCookie) {
      const tokenHash = hashGuestToken(guestCookie);
      const [guestCart] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.guestTokenHash, tokenHash))
        .limit(1);
      if (guestCart) cartId = guestCart.id;
    }
  }

  if (!cartId) {
    return {
      cartId: null,
      totalItems: 0,
      subtotalMinor: 0,
      items: [],
    };
  }

  const lines = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      variantId: cartItems.variantId,
      sku: productVariants.sku,
      variantTitle: productVariants.title,
      priceMinor: productVariants.priceMinor,
      mrpMinor: productVariants.mrpMinor,
      weightG: productVariants.weightG,
      options: productVariants.options,
      active: productVariants.active,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      productStatus: products.status,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  if (lines.length === 0) {
    return {
      cartId,
      totalItems: 0,
      subtotalMinor: 0,
      items: [],
    };
  }

  const pIds = lines.map((l) => l.productId);
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      storageKey: mediaAssets.storageKey,
      altText: mediaAssets.altText,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
    .where(inArray(productMedia.productId, pIds))
    .orderBy(asc(productMedia.sortOrder));

  const items = await Promise.all(
    lines.map(async (line) => {
      const stock = await getVariantStock(line.variantId);
      const media = mediaRows.find((m) => m.productId === line.productId);
      const unitPrice = line.priceMinor ?? 0;
      const lineTotal = unitPrice * line.quantity;
      const isAvailable = line.active && line.productStatus === "published" && stock.available >= line.quantity;

      return {
        id: line.id,
        variantId: line.variantId,
        sku: line.sku,
        variantTitle: line.variantTitle,
        unitPriceMinor: unitPrice,
        mrpMinor: line.mrpMinor,
        quantity: line.quantity,
        lineTotalMinor: lineTotal,
        weightG: line.weightG ?? 300,
        options: line.options,
        productId: line.productId,
        productName: line.productName,
        productSlug: line.productSlug,
        image: media ? getMediaAssetUrl(media.storageKey) : null,
        stockAvailable: stock.available,
        isAvailable,
      };
    })
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);

  return {
    cartId,
    totalItems,
    subtotalMinor,
    items,
  };
}

export async function mergeGuestCartOnLogin(userId: string, guestToken: string) {
  const tokenHash = hashGuestToken(guestToken);
  const [guestCart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.guestTokenHash, tokenHash))
    .limit(1);

  if (!guestCart) return;

  const [userCart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  const targetCartId = userCart
    ? userCart.id
    : (
        await db
          .insert(carts)
          .values({ userId, currency: "INR" })
          .returning({ id: carts.id })
      )[0].id;

  const guestItems = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, guestCart.id));

  for (const item of guestItems) {
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, targetCartId),
          eq(cartItems.variantId, item.variantId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId: targetCartId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
  }

  // Delete guest cart
  await db.delete(carts).where(eq(carts.id, guestCart.id));
}

export async function clearCart(cartId?: string) {
  if (cartId) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    return;
  }
  const details = await getCartDetails();
  if (details.cartId) {
    await db.delete(cartItems).where(eq(cartItems.cartId, details.cartId));
  }
}

