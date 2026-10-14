import { desc, eq } from "drizzle-orm";
import { type ShippingPincodeRate, shippingPincodeRates } from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  calculateWeightShipping,
  DEFAULT_SHIPPING_RATE_PER_KG_PAISE,
  findShippingRate,
  normalizePincode,
  validateShippingPincodePattern,
} from "./rules";

export interface ShippingQuote {
  /** Total shipping charge in paise (before any free-shipping threshold). */
  chargeMinor: number;
  /** True when no configured rate matched and the default rate was used. */
  isDefaultRate: boolean;
  /** Pattern of the matched rate, if any. */
  matchedPincode: string | null;
  ratePerKgMinor: number;
}

export async function listShippingRates(): Promise<ShippingPincodeRate[]> {
  return await db
    .select()
    .from(shippingPincodeRates)
    .orderBy(desc(shippingPincodeRates.createdAt));
}

/**
 * Charge for shipping `totalWeightG` grams to `pincode`.
 * Rate is per started kg (min 1 kg); unmatched PIN codes use the default rate.
 */
export async function quoteShipping(
  pincode: string,
  totalWeightG: number
): Promise<ShippingQuote> {
  const active = await db
    .select()
    .from(shippingPincodeRates)
    .where(eq(shippingPincodeRates.active, true));

  const match = findShippingRate(active, pincode);
  const ratePerKgMinor = match
    ? match.rateMinor
    : DEFAULT_SHIPPING_RATE_PER_KG_PAISE;

  return {
    chargeMinor: calculateWeightShipping(totalWeightG, ratePerKgMinor),
    isDefaultRate: !match,
    matchedPincode: match?.pincode ?? null,
    ratePerKgMinor,
  };
}

export interface SaveShippingRateInput {
  actorId?: string;
  active: boolean;
  description?: string | null;
  id?: string;
  pincode: string;
  rateMinor: number;
}

export async function saveShippingRate(
  input: SaveShippingRateInput
): Promise<ShippingPincodeRate> {
  const pincode = input.pincode.trim();
  const validation = validateShippingPincodePattern(pincode);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  if (!Number.isInteger(input.rateMinor) || input.rateMinor < 0) {
    throw new Error("Rate must be 0 or greater.");
  }

  const values = {
    pincode,
    type: validation.type,
    rateMinor: input.rateMinor,
    description: input.description?.trim() || null,
    active: input.active,
    updatedAt: new Date(),
  };

  const [saved] = input.id
    ? await db
        .update(shippingPincodeRates)
        .set(values)
        .where(eq(shippingPincodeRates.id, input.id))
        .returning()
    : await db.insert(shippingPincodeRates).values(values).returning();

  if (!saved) {
    throw new Error("Shipping rate not found.");
  }

  await audit({
    action: input.id ? "shipping_rate.updated" : "shipping_rate.created",
    actorId: input.actorId,
    entityType: "shipping_rate",
    entityId: saved.id,
    description: `Shipping rate ${pincode} ${input.id ? "updated" : "created"}.`,
    metadata: { pincode, type: validation.type, rateMinor: input.rateMinor },
  });

  return saved;
}

export async function deleteShippingRate(params: {
  actorId?: string;
  id: string;
}) {
  const [removed] = await db
    .delete(shippingPincodeRates)
    .where(eq(shippingPincodeRates.id, params.id))
    .returning();
  if (removed) {
    await audit({
      action: "shipping_rate.deleted",
      actorId: params.actorId,
      entityType: "shipping_rate",
      entityId: removed.id,
      description: `Shipping rate ${removed.pincode} deleted.`,
      metadata: { pincode: removed.pincode },
    });
  }
}

export { normalizePincode };
