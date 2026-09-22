import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import {
  categories,
  collectionProducts,
  collections,
  productCategories,
  productMedia,
  products,
  productVariants,
  variantChannels,
} from "../db/schema/catalog";
import { db } from "../lib/db";
import { saveMediaAsset } from "../lib/media/storage";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  console.log("Seeding catalog fixtures...");

  // 1. Categories
  console.log("- Creating categories...");
  let [homeCat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "home-kitchen"))
    .limit(1);

  if (!homeCat) {
    [homeCat] = await db
      .insert(categories)
      .values({
        name: "Home & Kitchen",
        slug: "home-kitchen",
        description:
          "Everyday essentials and beautiful functional pieces for your home.",
        status: "published",
        sortOrder: 1,
      })
      .returning();
  }

  let [storageCat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "storage-organization"))
    .limit(1);

  if (!storageCat) {
    [storageCat] = await db
      .insert(categories)
      .values({
        name: "Storage & Organization",
        slug: "storage-organization",
        parentId: homeCat.id,
        description: "Clear acrylic organizers, trays, and desk accessories.",
        status: "published",
        sortOrder: 2,
      })
      .returning();
  }

  // 2. Collection
  console.log("- Creating collection...");
  let [acrylicCol] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, "acrylic-essentials"))
    .limit(1);

  if (!acrylicCol) {
    [acrylicCol] = await db
      .insert(collections)
      .values({
        name: "Acrylic Essentials",
        slug: "acrylic-essentials",
        description:
          "Crystal clear acrylic organizers designed for modern spaces.",
        status: "published",
      })
      .returning();
  }

  // 3. Media Assets from amazon/pencil-holder-2
  console.log("- Importing pencil holder media assets...");
  const sourceDir = path.resolve(
    process.cwd(),
    "..",
    "..",
    "amazon",
    "pencil-holder-2"
  );
  const mediaAssetIds: string[] = [];

  if (existsSync(sourceDir)) {
    const files = readdirSync(sourceDir).filter(
      (f) => f.endsWith(".png") || f.endsWith(".jpg")
    );
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const buffer = readFileSync(filePath);
      const asset = await saveMediaAsset({
        filename: file,
        buffer,
        mimeType: "image/png",
        altText: "Zencino Acrylic Desk Organizer",
        source: "amazon-pencil-holder-2",
      });
      mediaAssetIds.push(asset.id);
      console.log(`  Imported ${file} -> asset ID ${asset.id}`);
    }
  }

  // 4. Product
  console.log("- Creating product...");
  const productSlug = "acrylic-desk-organizer-2-compartment";
  let [prod] = await db
    .select()
    .from(products)
    .where(eq(products.slug, productSlug))
    .limit(1);

  if (!prod) {
    [prod] = await db
      .insert(products)
      .values({
        name: "Acrylic Desk Organizer (2-Compartment)",
        slug: productSlug,
        description:
          "Keep your pens, brushes, and desk essentials neatly sorted with the Zencino 2-compartment clear acrylic organizer. Crafted with high-clarity acrylic with polished smooth edges.",
        primaryCategoryId: storageCat.id,
        status: "published",
        publishedAt: new Date(),
        specifications: {
          Material: "High-grade optical acrylic",
          Compartments: "2 vertical sections",
          Finish: "Diamond polished edges",
          "Color Clarity": "Ultra-clear 99% transparency",
          Origin: "India",
        },
        care: "Clean with a soft microfiber cloth and lukewarm water. Avoid alcohol and abrasive sponges.",
        packageContents:
          "1x Two-compartment acrylic organizer with anti-slip silicone feet.",
        seoTitle:
          "Zencino Acrylic Desk Organizer | 2-Compartment Pen & Brush Holder",
        seoDescription:
          "Organize your workspace in style with Zencino's crystal-clear acrylic pencil holder. 2 spacious compartments for stationery, brushes, and accessories.",
      })
      .returning();

    await db
      .insert(productCategories)
      .values({
        productId: prod.id,
        categoryId: storageCat.id,
      })
      .onConflictDoNothing();

    // 5. Variants
    console.log("- Creating variants...");
    const [var1] = await db
      .insert(productVariants)
      .values({
        productId: prod.id,
        sku: "ZNC-ORG-2C-1P",
        title: "Clear / 1-Pack",
        options: { Pack: "1-Pack", Color: "Clear" },
        optionSignature: JSON.stringify([
          ["Color", "Clear"],
          ["Pack", "1-Pack"],
        ]),
        priceMinor: 49_900, // ₹499
        mrpMinor: 79_900, // ₹799
        currency: "INR",
        weightG: 280,
        lengthMm: 130,
        widthMm: 95,
        heightMm: 110,
        active: true,
      })
      .returning();

    const [var2] = await db
      .insert(productVariants)
      .values({
        productId: prod.id,
        sku: "ZNC-ORG-2C-2P",
        title: "Clear / 2-Pack Value",
        options: { Pack: "2-Pack", Color: "Clear" },
        optionSignature: JSON.stringify([
          ["Color", "Clear"],
          ["Pack", "2-Pack"],
        ]),
        priceMinor: 89_900, // ₹899
        mrpMinor: 149_900, // ₹1,499
        currency: "INR",
        weightG: 550,
        lengthMm: 130,
        widthMm: 190,
        heightMm: 110,
        active: true,
      })
      .returning();

    // Channels
    await db.insert(variantChannels).values([
      {
        variantId: var1.id,
        channel: "website",
        enabled: true,
      },
      {
        variantId: var1.id,
        channel: "amazon",
        enabled: true,
        externalUrl: "https://www.amazon.in/dp/B08XYZ1234",
        asin: "B08XYZ1234",
        verifiedAt: new Date(),
      },
      {
        variantId: var2.id,
        channel: "website",
        enabled: true,
      },
      {
        variantId: var2.id,
        channel: "amazon",
        enabled: true,
        externalUrl: "https://www.amazon.in/dp/B08XYZ5678",
        asin: "B08XYZ5678",
        verifiedAt: new Date(),
      },
    ]);

    // Attach Media
    console.log("- Attaching media to product...");
    for (let i = 0; i < mediaAssetIds.length; i++) {
      await db.insert(productMedia).values({
        productId: prod.id,
        assetId: mediaAssetIds[i],
        variantId: i === 0 ? var1.id : null,
        sortOrder: i,
      });
    }

    // Add to Collection
    console.log("- Associating with Acrylic Essentials collection...");
    await db
      .insert(collectionProducts)
      .values({
        collectionId: acrylicCol.id,
        productId: prod.id,
        sortOrder: 0,
      })
      .onConflictDoNothing();
  }

  console.log("Catalog seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Failed to seed catalog:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
