import { and, count, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import {
  categories,
  collectionProducts,
  collections,
  productCategories,
  products,
} from "@/db/schema/catalog";
import {
  type Coupon,
  couponRedemptions,
  coupons,
  couponTargets,
} from "@/db/schema/coupons";
import { carts } from "@/db/schema/inventory";
import { orders } from "@/db/schema/orders";
import { audit } from "@/lib/audit";
import {
  allocateDiscount,
  calculateOrderTotals,
  evaluateCoupon,
  normalizeCouponCode,
  type OrderTotals,
} from "@/lib/commerce/rules";
import { db } from "@/lib/db";

type Executor = Pick<typeof db, "select">;

export interface CouponCustomer {
  email?: string | null;
  userId?: string | null;
}

// Redemptions on cancelled / payment-rejected orders no longer count.
async function countRedemptions(
  executor: Executor,
  couponId: string,
  customer?: CouponCustomer
): Promise<number> {
  const conditions = [
    eq(couponRedemptions.couponId, couponId),
    ne(orders.status, "cancelled"),
  ];

  if (customer) {
    const identity = [];
    if (customer.userId) {
      identity.push(eq(couponRedemptions.userId, customer.userId));
    }
    if (customer.email) {
      identity.push(
        eq(couponRedemptions.customerEmail, customer.email.trim().toLowerCase())
      );
    }
    if (identity.length === 0) {
      return 0;
    }
    const identityCondition = or(...identity);
    if (identityCondition) {
      conditions.push(identityCondition);
    }
  }

  const [row] = await executor
    .select({ value: count() })
    .from(couponRedemptions)
    .innerJoin(orders, eq(couponRedemptions.orderId, orders.id))
    .where(and(...conditions));
  return row?.value ?? 0;
}

export interface CouponCartLine {
  lineTotalMinor: number;
  productId: string;
}

export type CouponValidation =
  | {
      ok: true;
      discountMinor: number;
      /** discount share per input line (0 for ineligible lines) */
      lineDiscounts: number[];
    }
  | { ok: false; reason: string };

// Products the coupon may discount, given its "applies to" scope.
async function getEligibleProductIds(
  executor: Executor,
  coupon: Coupon,
  productIds: string[]
): Promise<Set<string>> {
  if (coupon.appliesTo === "all") {
    return new Set(productIds);
  }
  if (productIds.length === 0) {
    return new Set();
  }

  const targets = await executor
    .select({ type: couponTargets.targetType, id: couponTargets.targetId })
    .from(couponTargets)
    .where(eq(couponTargets.couponId, coupon.id));
  const idsOf = (type: string) =>
    targets.filter((t) => t.type === type).map((t) => t.id);

  const eligible = new Set<string>();

  if (coupon.appliesTo === "products") {
    const allowed = new Set(idsOf("product"));
    for (const id of productIds) {
      if (allowed.has(id)) {
        eligible.add(id);
      }
    }
    return eligible;
  }

  const categoryIds = idsOf("category");
  const collectionIds = idsOf("collection");

  if (categoryIds.length > 0) {
    const viaJoin = await executor
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(
        and(
          inArray(productCategories.productId, productIds),
          inArray(productCategories.categoryId, categoryIds)
        )
      );
    for (const row of viaJoin) {
      eligible.add(row.productId);
    }

    const viaPrimary = await executor
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          inArray(products.primaryCategoryId, categoryIds)
        )
      );
    for (const row of viaPrimary) {
      eligible.add(row.id);
    }
  }

  if (collectionIds.length > 0) {
    const rows = await executor
      .select({ productId: collectionProducts.productId })
      .from(collectionProducts)
      .where(
        and(
          inArray(collectionProducts.productId, productIds),
          inArray(collectionProducts.collectionId, collectionIds)
        )
      );
    for (const row of rows) {
      eligible.add(row.productId);
    }
  }

  return eligible;
}

/**
 * Full eligibility check: scope, rule evaluation, and total / per-customer
 * usage limits. The discount is calculated on eligible items only.
 */
export async function validateCoupon(
  executor: Executor,
  coupon: Coupon,
  lines: CouponCartLine[],
  customer: CouponCustomer = {}
): Promise<CouponValidation> {
  const eligibleIds = await getEligibleProductIds(executor, coupon, [
    ...new Set(lines.map((l) => l.productId)),
  ]);
  const eligibility = lines.map((l) => ({
    eligible: eligibleIds.has(l.productId),
    lineTotalMinor: l.lineTotalMinor,
  }));
  const eligibleSubtotalMinor = eligibility.reduce(
    (sum, l) => (l.eligible ? sum + l.lineTotalMinor : sum),
    0
  );

  if (eligibleSubtotalMinor <= 0) {
    return {
      ok: false,
      reason: "This coupon does not apply to the items in your bag.",
    };
  }

  const evaluated = evaluateCoupon(coupon, eligibleSubtotalMinor);
  if (!evaluated.ok) {
    return evaluated;
  }
  const result = {
    ok: true as const,
    discountMinor: evaluated.discountMinor,
    lineDiscounts: allocateDiscount(eligibility, evaluated.discountMinor),
  };

  if (coupon.usageLimit !== null) {
    const used = await countRedemptions(executor, coupon.id);
    if (used >= coupon.usageLimit) {
      return { ok: false, reason: "This coupon has reached its usage limit." };
    }
  }

  if (customer.userId || customer.email) {
    const usedByCustomer = await countRedemptions(
      executor,
      coupon.id,
      customer
    );
    if (usedByCustomer >= coupon.perCustomerLimit) {
      return {
        ok: false,
        reason:
          "You have already used this coupon the maximum number of times.",
      };
    }
  }

  return result;
}

export async function getCouponByCode(
  code: string,
  executor: Executor = db
): Promise<Coupon | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return null;
  }
  const [coupon] = await executor
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);
  return coupon ?? null;
}

// ---------------------------------------------------------------------------
// Cart pricing
// ---------------------------------------------------------------------------

export interface CartPricing extends OrderTotals {
  couponCode: string | null;
  couponDescription: string | null;
  couponError: string | null;
}

/**
 * Computes cart totals with the coupon attached to the cart (if still valid).
 * An invalid attached coupon is ignored and surfaced via `couponError`.
 */
export async function getCartPricing(
  cart: {
    cartId: string | null;
    items: CouponCartLine[];
    subtotalMinor: number;
  },
  customer: CouponCustomer = {}
): Promise<CartPricing> {
  const { cartId, subtotalMinor } = cart;
  const empty: CartPricing = {
    ...calculateOrderTotals(subtotalMinor, 0),
    couponCode: null,
    couponError: null,
    couponDescription: null,
  };

  if (!cartId || subtotalMinor <= 0) {
    return empty;
  }

  const [cartRow] = await db
    .select({ couponCode: carts.couponCode })
    .from(carts)
    .where(eq(carts.id, cartId))
    .limit(1);

  if (!cartRow?.couponCode) {
    return empty;
  }

  const coupon = await getCouponByCode(cartRow.couponCode);
  if (!coupon) {
    return { ...empty, couponError: "This coupon is no longer available." };
  }

  const result = await validateCoupon(db, coupon, cart.items, customer);
  if (!result.ok) {
    return { ...empty, couponError: result.reason };
  }

  return {
    ...calculateOrderTotals(subtotalMinor, result.discountMinor),
    couponCode: coupon.code,
    couponError: null,
    couponDescription: coupon.description,
  };
}

export async function applyCouponToCart(params: {
  cartId: string;
  code: string;
  customer?: CouponCustomer;
  items: CouponCartLine[];
}): Promise<{ ok: true; code: string } | { ok: false; reason: string }> {
  const coupon = await getCouponByCode(params.code);
  if (!coupon) {
    return { ok: false, reason: "Invalid coupon code." };
  }

  const result = await validateCoupon(
    db,
    coupon,
    params.items,
    params.customer
  );
  if (!result.ok) {
    return result;
  }

  await db
    .update(carts)
    .set({ couponCode: coupon.code, updatedAt: new Date() })
    .where(eq(carts.id, params.cartId));

  return { ok: true, code: coupon.code };
}

export async function removeCouponFromCart(cartId: string) {
  await db
    .update(carts)
    .set({ couponCode: null, updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface CouponTargetLabel {
  id: string;
  name: string;
  type: "product" | "category" | "collection";
}

export interface CouponWithUsage {
  coupon: Coupon;
  discountGivenMinor: number;
  targets: CouponTargetLabel[];
  usedCount: number;
}

export interface CouponTargetOptions {
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  products: { id: string; name: string }[];
}

export async function listCouponTargetOptions(): Promise<CouponTargetOptions> {
  const [productRows, categoryRows, collectionRows] = await Promise.all([
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .orderBy(products.name),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(categories.name),
    db
      .select({ id: collections.id, name: collections.name })
      .from(collections)
      .orderBy(collections.name),
  ]);
  return {
    products: productRows,
    categories: categoryRows,
    collections: collectionRows,
  };
}

export async function listCouponsWithUsage(): Promise<CouponWithUsage[]> {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));

  const usage = await db
    .select({
      couponId: couponRedemptions.couponId,
      used: count(),
      discount: sql<number>`coalesce(sum(${couponRedemptions.discountMinor}), 0)::int`,
    })
    .from(couponRedemptions)
    .innerJoin(orders, eq(couponRedemptions.orderId, orders.id))
    .where(ne(orders.status, "cancelled"))
    .groupBy(couponRedemptions.couponId);

  const options = await listCouponTargetOptions();
  const nameOf = {
    product: new Map(options.products.map((o) => [o.id, o.name])),
    category: new Map(options.categories.map((o) => [o.id, o.name])),
    collection: new Map(options.collections.map((o) => [o.id, o.name])),
  };
  const targetRows = await db.select().from(couponTargets);

  const byCoupon = new Map(usage.map((u) => [u.couponId, u]));
  return rows.map((coupon) => ({
    coupon,
    targets: targetRows
      .filter((t) => t.couponId === coupon.id)
      .map((t) => ({
        id: t.targetId,
        type: t.targetType,
        name: nameOf[t.targetType].get(t.targetId) ?? "Removed item",
      })),
    usedCount: byCoupon.get(coupon.id)?.used ?? 0,
    discountGivenMinor: byCoupon.get(coupon.id)?.discount ?? 0,
  }));
}

export interface CouponTargetInput {
  targetId: string;
  targetType: "product" | "category" | "collection";
}

export interface SaveCouponInput {
  active: boolean;
  actorId?: string;
  appliesTo: "all" | "products" | "categories";
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number; // percent (1-100) or paise
  expiresAt: Date | null;
  maxDiscountMinor: number | null;
  minOrderMinor: number;
  perCustomerLimit: number;
  startsAt: Date | null;
  targets: CouponTargetInput[];
  usageLimit: number | null;
}

export function validateCouponInput(input: SaveCouponInput): string | null {
  const code = normalizeCouponCode(input.code);
  if (code.length < 3 || code.length > 32) {
    return "Coupon code must be 3-32 letters, numbers, - or _.";
  }
  if (!Number.isInteger(input.discountValue) || input.discountValue <= 0) {
    return "Discount value must be greater than zero.";
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    return "Percentage discount cannot exceed 100%.";
  }
  if (input.minOrderMinor < 0) {
    return "Minimum order value cannot be negative.";
  }
  if (input.maxDiscountMinor !== null && input.maxDiscountMinor <= 0) {
    return "Maximum discount must be greater than zero.";
  }
  if (input.usageLimit !== null && input.usageLimit < 1) {
    return "Total usage limit must be at least 1.";
  }
  if (input.perCustomerLimit < 1) {
    return "Per-customer limit must be at least 1.";
  }
  if (input.appliesTo === "products") {
    if (!input.targets.some((t) => t.targetType === "product")) {
      return "Select at least one product for this coupon.";
    }
  } else if (
    input.appliesTo === "categories" &&
    !input.targets.some((t) => t.targetType !== "product")
  ) {
    return "Select at least one category or collection for this coupon.";
  }
  if (
    input.startsAt &&
    input.expiresAt &&
    input.expiresAt.getTime() <= input.startsAt.getTime()
  ) {
    return "Expiry must be after the start date.";
  }
  return null;
}

export async function saveCoupon(input: SaveCouponInput): Promise<Coupon> {
  const error = validateCouponInput(input);
  if (error) {
    throw new Error(error);
  }

  const code = normalizeCouponCode(input.code);
  const values = {
    code,
    description: input.description?.trim() || null,
    discountType: input.discountType,
    discountValue: input.discountValue,
    appliesTo: input.appliesTo,
    maxDiscountMinor:
      input.discountType === "percent" ? input.maxDiscountMinor : null,
    minOrderMinor: input.minOrderMinor,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    usageLimit: input.usageLimit,
    perCustomerLimit: input.perCustomerLimit,
    active: input.active,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  // Only keep targets that match the chosen scope
  const targets = input.targets.filter((t) =>
    input.appliesTo === "products"
      ? t.targetType === "product"
      : input.appliesTo === "categories" && t.targetType !== "product"
  );

  const saved = await db.transaction(async (tx) => {
    const [row] = existing
      ? await tx
          .update(coupons)
          .set(values)
          .where(eq(coupons.id, existing.id))
          .returning()
      : await tx.insert(coupons).values(values).returning();

    await tx.delete(couponTargets).where(eq(couponTargets.couponId, row.id));
    if (targets.length > 0) {
      await tx
        .insert(couponTargets)
        .values(targets.map((t) => ({ ...t, couponId: row.id })))
        .onConflictDoNothing();
    }
    return row;
  });

  await audit({
    action: existing ? "coupon.updated" : "coupon.created",
    actorId: input.actorId,
    entityType: "coupon",
    entityId: saved.id,
    description: `Coupon ${code} ${existing ? "updated" : "created"}.`,
    metadata: {
      code,
      discountType: input.discountType,
      appliesTo: input.appliesTo,
      targetCount: targets.length,
    },
  });

  return saved;
}

export async function setCouponActive(params: {
  actorId?: string;
  active: boolean;
  couponId: string;
}) {
  const [updated] = await db
    .update(coupons)
    .set({ active: params.active, updatedAt: new Date() })
    .where(eq(coupons.id, params.couponId))
    .returning();

  if (updated) {
    await audit({
      action: params.active ? "coupon.enabled" : "coupon.disabled",
      actorId: params.actorId,
      entityType: "coupon",
      entityId: updated.id,
      description: `Coupon ${updated.code} ${params.active ? "enabled" : "disabled"}.`,
    });
  }
}
