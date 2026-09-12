import { and, eq, inArray, sql } from "drizzle-orm";
import {
  inventoryBalances,
  inventoryLocations,
  inventoryMovements,
  products,
  productVariants,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export const DEFAULT_LOCATION_CODE = "MAIN_WH";

export async function getOrCreateDefaultLocation() {
  let [location] = await db
    .select()
    .from(inventoryLocations)
    .where(eq(inventoryLocations.code, DEFAULT_LOCATION_CODE))
    .limit(1);

  if (!location) {
    [location] = await db
      .insert(inventoryLocations)
      .values({
        code: DEFAULT_LOCATION_CODE,
        name: "Central Fulfilment Facility",
        active: true,
      })
      .returning();
  }

  return location;
}

export async function getVariantStock(variantId: string, locationId?: string) {
  const loc = locationId ? { id: locationId } : await getOrCreateDefaultLocation();

  const [balance] = await db
    .select()
    .from(inventoryBalances)
    .where(
      and(
        eq(inventoryBalances.variantId, variantId),
        eq(inventoryBalances.locationId, loc.id)
      )
    )
    .limit(1);

  if (!balance) {
    return {
      variantId,
      locationId: loc.id,
      onHand: 0,
      reserved: 0,
      available: 0,
      reorderLevel: 5,
    };
  }

  const available = Math.max(0, balance.onHand - balance.reserved);
  return {
    ...balance,
    available,
  };
}

export async function getAllVariantsStock() {
  const loc = await getOrCreateDefaultLocation();

  const variants = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      title: productVariants.title,
      priceMinor: productVariants.priceMinor,
      active: productVariants.active,
      productId: productVariants.productId,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id));

  if (variants.length === 0) return [];

  const balances = await db
    .select()
    .from(inventoryBalances)
    .where(eq(inventoryBalances.locationId, loc.id));

  const balanceMap = new Map(balances.map((b) => [b.variantId, b]));

  return variants.map((v) => {
    const bal = balanceMap.get(v.id);
    const onHand = bal?.onHand ?? 0;
    const reserved = bal?.reserved ?? 0;
    const available = Math.max(0, onHand - reserved);
    const reorderLevel = bal?.reorderLevel ?? 5;

    return {
      variantId: v.id,
      sku: v.sku,
      title: v.title,
      priceMinor: v.priceMinor,
      active: v.active,
      productId: v.productId,
      productName: v.productName,
      productSlug: v.productSlug,
      onHand,
      reserved,
      available,
      reorderLevel,
      locationId: loc.id,
      isLowStock: onHand <= reorderLevel,
    };
  });
}

export interface StockAdjustmentParams {
  variantId: string;
  onHandDelta: number;
  reason: string;
  actorId?: string;
  referenceType?: string;
  referenceId?: string;
  locationId?: string;
}

export async function adjustStock(params: StockAdjustmentParams) {
  const {
    variantId,
    onHandDelta,
    reason,
    actorId,
    referenceType = "admin_adjustment",
    referenceId,
    locationId,
  } = params;

  const loc = locationId ? { id: locationId } : await getOrCreateDefaultLocation();

  // Execute in transaction
  return await db.transaction(async (tx) => {
    let [balance] = await tx
      .select()
      .from(inventoryBalances)
      .where(
        and(
          eq(inventoryBalances.variantId, variantId),
          eq(inventoryBalances.locationId, loc.id)
        )
      )
      .limit(1);

    if (!balance) {
      [balance] = await tx
        .insert(inventoryBalances)
        .values({
          variantId,
          locationId: loc.id,
          onHand: 0,
          reserved: 0,
          reorderLevel: 5,
        })
        .returning();
    }

    const newOnHand = balance.onHand + onHandDelta;
    if (newOnHand < 0) {
      throw new Error("On hand stock cannot be negative.");
    }
    if (newOnHand < balance.reserved) {
      throw new Error(
        `Cannot reduce stock below currently reserved units (${balance.reserved} reserved).`
      );
    }

    const [updatedBalance] = await tx
      .update(inventoryBalances)
      .set({
        onHand: newOnHand,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryBalances.variantId, variantId),
          eq(inventoryBalances.locationId, loc.id)
        )
      )
      .returning();

    // Append movement log
    await tx.insert(inventoryMovements).values({
      variantId,
      locationId: loc.id,
      onHandDelta,
      reservedDelta: 0,
      reason,
      referenceType,
      referenceId,
      actorId,
    });

    await audit({
      action: "inventory.stock_adjusted",
      actorId,
      entityType: "product_variant",
      entityId: variantId,
      description: `Stock adjusted by ${onHandDelta > 0 ? `+${onHandDelta}` : onHandDelta} units. Reason: ${reason}`,
      metadata: {
        variantId,
        onHandDelta,
        newOnHand,
        reason,
      },
    });

    return {
      ...updatedBalance,
      available: Math.max(0, updatedBalance.onHand - updatedBalance.reserved),
    };
  });
}

export async function getRecentStockMovements(limit = 25) {
  return db
    .select({
      id: inventoryMovements.id,
      variantId: inventoryMovements.variantId,
      onHandDelta: inventoryMovements.onHandDelta,
      reservedDelta: inventoryMovements.reservedDelta,
      reason: inventoryMovements.reason,
      referenceType: inventoryMovements.referenceType,
      createdAt: inventoryMovements.createdAt,
      sku: productVariants.sku,
      variantTitle: productVariants.title,
    })
    .from(inventoryMovements)
    .innerJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
    .orderBy(sql`${inventoryMovements.createdAt} DESC`)
    .limit(limit);
}
