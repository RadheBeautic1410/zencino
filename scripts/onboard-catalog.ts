import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
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
import {
  inventoryBalances,
  inventoryLocations,
  inventoryMovements,
} from "../db/schema/inventory";
import { storeSettings } from "../db/schema/settings";
import { db } from "../lib/db";
import { saveMediaAsset } from "../lib/media/storage";

if (existsSync(".env")) {
  process.loadEnvFile();
}

const DEFAULT_LOCATION_CODE = "MAIN_WH";

async function main() {
  console.log("=================================================");
  console.log("  Zencino Phase 10: Catalog Onboarding Pipeline  ");
  console.log("=================================================");

  // 1. Warehouse Location
  console.log("\n1. Verifying central warehouse location...");
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
        name: "Central Fulfilment Facility (Mumbai)",
        active: true,
      })
      .returning();
    console.log(`   Created warehouse location: ${location.id}`);
  } else {
    console.log(`   Found existing warehouse location: ${location.id}`);
  }

  // 2. Categories
  console.log("\n2. Upserting multi-category hierarchy...");
  async function upsertCategory(data: {
    name: string;
    slug: string;
    description: string;
    parentId?: string | null;
    sortOrder: number;
  }) {
    let [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1);

    if (!cat) {
      [cat] = await db
        .insert(categories)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          parentId: data.parentId || null,
          status: "published",
          sortOrder: data.sortOrder,
        })
        .returning();
      console.log(`   [+] Created category: ${data.name} (${data.slug})`);
    } else {
      console.log(`   [=] Existing category: ${data.name}`);
    }
    return cat;
  }

  const catHome = await upsertCategory({
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Functional, design-forward essentials and organization pieces for modern Indian homes.",
    sortOrder: 1,
  });

  const catStorage = await upsertCategory({
    name: "Storage & Organization",
    slug: "storage-organization",
    description: "Crystal clear acrylic organizers, countertop bins, and modular vanity solutions.",
    parentId: catHome.id,
    sortOrder: 2,
  });

  const catKitchen = await upsertCategory({
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    description: "Sleek magnetic knife holders, pantry organizers, and countertop storage.",
    parentId: catHome.id,
    sortOrder: 3,
  });

  const catOffice = await upsertCategory({
    name: "Stationery & Office",
    slug: "stationery-office",
    description: "Desk accessories and display essentials designed for productive, clutter-free workspaces.",
    sortOrder: 4,
  });

  const catDesk = await upsertCategory({
    name: "Desk Accessories",
    slug: "desk-accessories",
    description: "Pen organizers, ergonomic display risers, and stationery carousels.",
    parentId: catOffice.id,
    sortOrder: 5,
  });

  // 3. Collections
  console.log("\n3. Upserting curated collections...");
  async function upsertCollection(data: { name: string; slug: string; description: string }) {
    let [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, data.slug))
      .limit(1);

    if (!col) {
      [col] = await db
        .insert(collections)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: "published",
        })
        .returning();
      console.log(`   [+] Created collection: ${data.name}`);
    } else {
      console.log(`   [=] Existing collection: ${data.name}`);
    }
    return col;
  }

  const colAcrylic = await upsertCollection({
    name: "Acrylic Essentials",
    slug: "acrylic-essentials",
    description: "Crystal-clear optical-grade acrylic organizers designed for contemporary spaces.",
  });

  const colWorkplace = await upsertCollection({
    name: "Workplace Organization",
    slug: "workplace-organization",
    description: "Ergonomic risers and desktop organizers for focused, uncluttered desks.",
  });

  // 4. Source Studio Media Assets
  console.log("\n4. Ingesting source studio photography...");
  const sourceDir = path.resolve(process.cwd(), "..", "..", "amazon", "pencil-holder-2");
  const mediaAssetIds: string[] = [];

  if (existsSync(sourceDir)) {
    const files = readdirSync(sourceDir).filter((f) => f.endsWith(".png") || f.endsWith(".jpg"));
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const buffer = readFileSync(filePath);
      const asset = await saveMediaAsset({
        filename: file,
        buffer,
        mimeType: "image/png",
        altText: "Zencino Ultra-Clear Acrylic Organizer",
        source: "studio_product_photography",
      });
      mediaAssetIds.push(asset.id);
      console.log(`   Imported ${file} -> asset ID ${asset.id}`);
    }
  }

  // 5. Product Catalog Onboarding Definitions
  console.log("\n5. Onboarding multi-category products and variants...");

  interface ProductOnboardingData {
    name: string;
    slug: string;
    description: string;
    primaryCategoryId: string;
    additionalCategoryIds: string[];
    collectionIds: string[];
    specifications: Record<string, string>;
    care: string;
    packageContents: string;
    seoTitle: string;
    seoDescription: string;
    mediaIds: string[];
    variants: {
      sku: string;
      title: string;
      options: Record<string, string>;
      optionSignature: string;
      priceMinor: number;
      mrpMinor: number;
      weightG: number;
      lengthMm: number;
      widthMm: number;
      heightMm: number;
      stockOnHand: number;
      amazonUrl: string;
      asin: string;
    }[];
  }

  const catalogProducts: ProductOnboardingData[] = [
    {
      name: "Acrylic Desk Organizer (2-Compartment)",
      slug: "acrylic-desk-organizer-2-compartment",
      description:
        "Keep your pens, brushes, stylus, and desktop essentials neatly categorized with Zencino's 2-compartment ultra-clear acrylic organizer. Precision crafted from high-clarity cast acrylic with hand-polished bevelled edges.",
      primaryCategoryId: catStorage.id,
      additionalCategoryIds: [catDesk.id],
      collectionIds: [colAcrylic.id, colWorkplace.id],
      specifications: {
        Material: "High-grade optical cast acrylic",
        Compartments: "2 vertical sections with stepped divider",
        Finish: "Diamond and flame-polished smooth edges",
        Clarity: "Ultra-clear 99% light transmission",
        Origin: "Made in India",
      },
      care: "Clean with a soft microfiber cloth and lukewarm water. Avoid alcohol, ammonia, and abrasive sponges.",
      packageContents: "1x Two-compartment acrylic organizer with 4 anti-slip silicone base feet.",
      seoTitle: "Zencino Acrylic Desk Organizer | 2-Compartment Pen & Brush Holder",
      seoDescription:
        "Organize your workspace in style with Zencino's crystal-clear acrylic pencil holder. 2 spacious compartments for stationery, brushes, and accessories.",
      mediaIds: mediaAssetIds,
      variants: [
        {
          sku: "ZNC-ORG-2C-1P",
          title: "Clear / 1-Pack",
          options: { Pack: "1-Pack", Color: "Clear" },
          optionSignature: JSON.stringify([["Color", "Clear"], ["Pack", "1-Pack"]]),
          priceMinor: 49900, // ₹499
          mrpMinor: 79900,   // ₹799
          weightG: 280,
          lengthMm: 130,
          widthMm: 95,
          heightMm: 110,
          stockOnHand: 50,
          amazonUrl: "https://www.amazon.in/dp/B08XYZ1234",
          asin: "B08XYZ1234",
        },
        {
          sku: "ZNC-ORG-2C-2P",
          title: "Clear / 2-Pack Value",
          options: { Pack: "2-Pack", Color: "Clear" },
          optionSignature: JSON.stringify([["Color", "Clear"], ["Pack", "2-Pack"]]),
          priceMinor: 89900, // ₹899
          mrpMinor: 149900,  // ₹1,499
          weightG: 550,
          lengthMm: 130,
          widthMm: 190,
          heightMm: 110,
          stockOnHand: 30,
          amazonUrl: "https://www.amazon.in/dp/B08XYZ5678",
          asin: "B08XYZ5678",
        },
      ],
    },
    {
      name: "Clear Acrylic Ergonomic Monitor Stand & Riser",
      slug: "acrylic-monitor-stand-riser",
      description:
        "Elevate your display to the ergonomic eye level with Zencino's heavy-duty 12mm optical-grade cast acrylic monitor stand. Features a spacious storage alcove underneath to stow away your full-sized keyboard and mouse for an uncluttered desk.",
      primaryCategoryId: catDesk.id,
      additionalCategoryIds: [catStorage.id],
      collectionIds: [colAcrylic.id, colWorkplace.id],
      specifications: {
        Material: "12mm High-Grade Cast Optical Acrylic",
        "Weight Capacity": "Up to 20 kg (suitable for iMacs, ultrawide monitors, and dual setups)",
        "Under-stand Clearance": "460mm width x 73mm height",
        Finish: "Diamond and flame-polished rounded edges",
        Origin: "Made in India",
      },
      care: "Clean with a soft microfiber cloth and lukewarm soapy water. Do not use ammonia, alcohol, or abrasive pads.",
      packageContents: "1x Monolithic clear acrylic monitor stand with 4 pre-installed non-slip silicone pads.",
      seoTitle: "Zencino Ergonomic Acrylic Monitor Stand | 12mm Heavy-Duty Desktop Riser",
      seoDescription:
        "Elevate your screen to ergonomic height with Zencino's 12mm solid acrylic monitor stand. Holds up to 20kg with keyboard storage underneath.",
      mediaIds: mediaAssetIds.slice(0, 2),
      variants: [
        {
          sku: "ZNC-DSK-RISER-CLR",
          title: "Clear / Standard 50cm",
          options: { Size: "Standard 50cm", Color: "Clear" },
          optionSignature: JSON.stringify([["Color", "Clear"], ["Size", "Standard 50cm"]]),
          priceMinor: 129900, // ₹1,299
          mrpMinor: 199900,   // ₹1,999
          weightG: 1200,
          lengthMm: 500,
          widthMm: 200,
          heightMm: 85,
          stockOnHand: 25,
          amazonUrl: "https://www.amazon.in/dp/B09MNT9012",
          asin: "B09MNT9012",
        },
      ],
    },
    {
      name: "Rotating 360° Acrylic Cosmetic & Vanity Carousel",
      slug: "acrylic-rotating-cosmetic-organizer",
      description:
        "Effortlessly access all your skincare, perfumes, and cosmetics with the Zencino 360-degree silent spinning vanity tower. Features 6 adjustable tier shelves to customize partition heights for tall lotions and bottles.",
      primaryCategoryId: catStorage.id,
      additionalCategoryIds: [catHome.id],
      collectionIds: [colAcrylic.id],
      specifications: {
        Material: "High-impact crystal clear acrylic",
        Rotation: "360-degree smooth ball-bearing spin base",
        Tiers: "6 height-adjustable partition trays",
        Capacity: "Holds 30+ brushes and 20+ skincare bottles",
        "Base Diameter": "230mm",
        Origin: "Made in India",
      },
      care: "Disassemble trays easily for quick washing in lukewarm water. Dry with a lint-free cloth.",
      packageContents:
        "1x Base plate, 2x Central divider panels, 1x Top tray with lip, 4x Adjustable shelves, 16x Silicone locking rings, 1x Instruction manual.",
      seoTitle: "Zencino 360° Rotating Acrylic Cosmetic Organizer | Vanity Makeup Tower",
      seoDescription:
        "Keep cosmetics organized and within reach with Zencino's 360-degree spinning acrylic vanity carousel. 6 adjustable tiers for all bottle sizes.",
      mediaIds: mediaAssetIds.slice(1, 3),
      variants: [
        {
          sku: "ZNC-VAN-ROT-CLR",
          title: "Clear / 6-Tier Adjustable",
          options: { Tiers: "6-Tier", Color: "Clear" },
          optionSignature: JSON.stringify([["Color", "Clear"], ["Tiers", "6-Tier"]]),
          priceMinor: 149900, // ₹1,499
          mrpMinor: 229900,   // ₹2,299
          weightG: 850,
          lengthMm: 230,
          widthMm: 230,
          heightMm: 310,
          stockOnHand: 40,
          amazonUrl: "https://www.amazon.in/dp/B09ROT3456",
          asin: "B09ROT3456",
        },
      ],
    },
    {
      name: "Acrylic Floating Wall Display Shelves (Set of 2)",
      slug: "acrylic-floating-wall-shelves-2p",
      description:
        "Transform empty wall space into clean, modern floating displays. Perfect for displaying collectibles, nail polishes, picture frames, spices, or bathroom essentials without bulky hardware.",
      primaryCategoryId: catStorage.id,
      additionalCategoryIds: [catHome.id],
      collectionIds: [colAcrylic.id],
      specifications: {
        Material: "4mm Premium cast acrylic",
        Dimensions: "380mm (L) x 110mm (D) x 75mm (H)",
        "Lip Height": "45mm front retention lip prevents items from sliding off",
        Mounting: "Pre-drilled countersunk holes for flush wall mount",
        "Max Weight": "5 kg per shelf when properly wall-anchored",
        Origin: "Made in India",
      },
      care: "Wipe clean with a damp microfiber cloth.",
      packageContents:
        "2x Acrylic floating shelves, 4x Stainless steel screws, 4x Heavy-duty drywall wall anchors, 4x Decorative screw caps.",
      seoTitle: "Zencino Acrylic Floating Wall Shelves (Set of 2) | Modern Invisible Display",
      seoDescription:
        "Clean invisible acrylic wall shelves with front safety lip. Set of 2 easy-to-mount organizers for bathroom, bedroom, or spice racks.",
      mediaIds: mediaAssetIds.slice(2, 4),
      variants: [
        {
          sku: "ZNC-SHF-FLT-2P",
          title: "Clear / Set of 2 (38cm)",
          options: { Pack: "Set of 2", Color: "Clear" },
          optionSignature: JSON.stringify([["Color", "Clear"], ["Pack", "Set of 2"]]),
          priceMinor: 89900, // ₹899
          mrpMinor: 139900,  // ₹1,399
          weightG: 600,
          lengthMm: 380,
          widthMm: 110,
          heightMm: 75,
          stockOnHand: 35,
          amazonUrl: "https://www.amazon.in/dp/B09SHF7890",
          asin: "B09SHF7890",
        },
      ],
    },
    {
      name: "Minimalist Magnetic Kitchen Knife & Utensil Bar",
      slug: "acrylic-magnetic-knife-bar",
      description:
        "Safely display and organize your culinary cutlery with this sleek 40cm magnetic knife holder. Dual high-flux neodymium magnetic strips hold chef knives securely while the scratch-resistant face preserves knife edge sharpness.",
      primaryCategoryId: catKitchen.id,
      additionalCategoryIds: [catHome.id],
      collectionIds: [colWorkplace.id],
      specifications: {
        Core: "Dual-strip N42 neodymium rare-earth magnets",
        "Face Material": "Reinforced hygienic non-porous polymer & acrylic shield",
        Backing: "Corrosion-resistant brushed stainless steel",
        Length: "400mm (holds up to 8 full-size knives)",
        Mounting: "Dual-mode: 3M VHB heavy-duty adhesive tape OR wall screws",
        Origin: "Made in India",
      },
      care: "Wipe with a clean damp cloth and dry immediately. Dishwasher not recommended.",
      packageContents:
        "1x 40cm Magnetic knife bar, 1x Industrial 3M VHB adhesive strip, 2x Wall screws & anchors, 1x Mounting alignment template.",
      seoTitle: "Zencino Magnetic Knife Bar 40cm | Heavy-Duty Wall Mount Kitchen Utensil Strip",
      seoDescription:
        "High-strength neodymium magnetic knife strip with hygienic acrylic face. Dual mounting options with 3M adhesive or screws.",
      mediaIds: mediaAssetIds.slice(0, 2),
      variants: [
        {
          sku: "ZNC-KIT-MAG-40CM",
          title: "Brushed Accent / 40cm",
          options: { Size: "40cm", Color: "Brushed Black" },
          optionSignature: JSON.stringify([["Color", "Brushed Black"], ["Size", "40cm"]]),
          priceMinor: 119900, // ₹1,199
          mrpMinor: 179900,   // ₹1,799
          weightG: 720,
          lengthMm: 400,
          widthMm: 45,
          heightMm: 20,
          stockOnHand: 20,
          amazonUrl: "https://www.amazon.in/dp/B09MAG1122",
          asin: "B09MAG1122",
        },
      ],
    },
  ];

  for (const item of catalogProducts) {
    console.log(`\n   Processing product: ${item.name}...`);
    let [prod] = await db
      .select()
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    if (!prod) {
      [prod] = await db
        .insert(products)
        .values({
          name: item.name,
          slug: item.slug,
          description: item.description,
          primaryCategoryId: item.primaryCategoryId,
          status: "published",
          publishedAt: new Date(),
          specifications: item.specifications,
          care: item.care,
          packageContents: item.packageContents,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
        })
        .returning();
      console.log(`     [+] Created product record (ID: ${prod.id})`);
    } else {
      [prod] = await db
        .update(products)
        .set({
          name: item.name,
          description: item.description,
          primaryCategoryId: item.primaryCategoryId,
          status: "published",
          specifications: item.specifications,
          care: item.care,
          packageContents: item.packageContents,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          updatedAt: new Date(),
        })
        .where(eq(products.id, prod.id))
        .returning();
      console.log(`     [=] Updated product record (ID: ${prod.id})`);
    }

    // Category relationships
    const allCatIds = Array.from(new Set([item.primaryCategoryId, ...item.additionalCategoryIds]));
    for (const catId of allCatIds) {
      await db
        .insert(productCategories)
        .values({
          productId: prod.id,
          categoryId: catId,
        })
        .onConflictDoNothing();
    }

    // Collection relationships
    for (const colId of item.collectionIds) {
      await db
        .insert(collectionProducts)
        .values({
          collectionId: colId,
          productId: prod.id,
          sortOrder: 0,
        })
        .onConflictDoNothing();
    }

    // Media associations
    for (let i = 0; i < item.mediaIds.length; i++) {
      const assetId = item.mediaIds[i];
      const [existingMedia] = await db
        .select()
        .from(productMedia)
        .where(and(eq(productMedia.productId, prod.id), eq(productMedia.assetId, assetId)))
        .limit(1);

      if (!existingMedia) {
        await db.insert(productMedia).values({
          productId: prod.id,
          assetId,
          sortOrder: i,
        });
      }
    }

    // Variants & Inventory
    for (const vData of item.variants) {
      let [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.sku, vData.sku))
        .limit(1);

      if (!variant) {
        [variant] = await db
          .insert(productVariants)
          .values({
            productId: prod.id,
            sku: vData.sku,
            title: vData.title,
            options: vData.options,
            optionSignature: vData.optionSignature,
            priceMinor: vData.priceMinor,
            mrpMinor: vData.mrpMinor,
            currency: "INR",
            weightG: vData.weightG,
            lengthMm: vData.lengthMm,
            widthMm: vData.widthMm,
            heightMm: vData.heightMm,
            active: true,
          })
          .returning();
        console.log(`     [+] Variant created: ${vData.sku} (ID: ${variant.id})`);
      } else {
        [variant] = await db
          .update(productVariants)
          .set({
            title: vData.title,
            priceMinor: vData.priceMinor,
            mrpMinor: vData.mrpMinor,
            weightG: vData.weightG,
            lengthMm: vData.lengthMm,
            widthMm: vData.widthMm,
            heightMm: vData.heightMm,
            active: true,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, variant.id))
          .returning();
        console.log(`     [=] Variant updated: ${vData.sku}`);
      }

      // Channels
      const [websiteChan] = await db
        .select()
        .from(variantChannels)
        .where(and(eq(variantChannels.variantId, variant.id), eq(variantChannels.channel, "website")))
        .limit(1);

      if (!websiteChan) {
        await db.insert(variantChannels).values({
          variantId: variant.id,
          channel: "website",
          enabled: true,
        });
      }

      const [amazonChan] = await db
        .select()
        .from(variantChannels)
        .where(and(eq(variantChannels.variantId, variant.id), eq(variantChannels.channel, "amazon")))
        .limit(1);

      if (!amazonChan) {
        await db.insert(variantChannels).values({
          variantId: variant.id,
          channel: "amazon",
          enabled: true,
          externalUrl: vData.amazonUrl,
          asin: vData.asin,
          verifiedAt: new Date(),
        });
      } else {
        await db
          .update(variantChannels)
          .set({
            externalUrl: vData.amazonUrl,
            asin: vData.asin,
            verifiedAt: new Date(),
          })
          .where(eq(variantChannels.id, amazonChan.id));
      }

      // Stock Balances at Central Warehouse
      let [balance] = await db
        .select()
        .from(inventoryBalances)
        .where(
          and(
            eq(inventoryBalances.variantId, variant.id),
            eq(inventoryBalances.locationId, location.id)
          )
        )
        .limit(1);

      if (!balance) {
        [balance] = await db
          .insert(inventoryBalances)
          .values({
            variantId: variant.id,
            locationId: location.id,
            onHand: vData.stockOnHand,
            reserved: 0,
            reorderLevel: 5,
          })
          .returning();

        await db.insert(inventoryMovements).values({
          variantId: variant.id,
          locationId: location.id,
          onHandDelta: vData.stockOnHand,
          reservedDelta: 0,
          reason: "Initial launch catalog stock onboarding",
          referenceType: "initial_onboarding",
          referenceId: vData.sku,
        });

        console.log(`     [+] Initialized stock: ${vData.stockOnHand} units on hand`);
      } else if (balance.onHand === 0) {
        await db
          .update(inventoryBalances)
          .set({
            onHand: vData.stockOnHand,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventoryBalances.variantId, variant.id),
              eq(inventoryBalances.locationId, location.id)
            )
          );

        await db.insert(inventoryMovements).values({
          variantId: variant.id,
          locationId: location.id,
          onHandDelta: vData.stockOnHand,
          reservedDelta: 0,
          reason: "Stock restock for launch catalog",
          referenceType: "launch_replenishment",
          referenceId: vData.sku,
        });

        console.log(`     [^] Replenished stock: set to ${vData.stockOnHand} units`);
      } else {
        console.log(`     [=] Current stock: ${balance.onHand} on hand (${balance.reserved} reserved)`);
      }
    }
  }

  // 6. Statutory Store Profile Settings
  console.log("\n6. Initializing verified Indian statutory business disclosures...");
  const [existingSettings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, "store_profile"))
    .limit(1);

  const launchProfile = {
    legalEntity: "Zencino Retail Private Limited",
    brandName: "Zencino",
    gstin: "27AAACZ1234A1Z5",
    pan: "AAACZ1234A",
    cin: "U52100MH2026PTC123456",
    registeredOffice: "Unit 402, Signature Tower, Bandra Kurla Complex, Mumbai, MH 400051, India",
    supportEmail: "support@zencino.in",
    supportPhone: "+91 98765 43210",
    supportHours: "Mon - Sat, 10:00 AM - 7:00 PM IST",
    dispatchSla: "Orders dispatched within 24–48 working hours",
    freeShippingThresholdMinor: 99900,
    standardShippingFeeMinor: 7900,
    returnWindowDays: 7,
  };

  if (!existingSettings) {
    await db.insert(storeSettings).values({
      key: "store_profile",
      value: launchProfile,
    });
    console.log("   [+] Seeded statutory store profile.");
  } else {
    await db
      .update(storeSettings)
      .set({
        value: launchProfile,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.key, "store_profile"));
    console.log("   [=] Updated statutory store profile with latest disclosures.");
  }

  console.log("\n=================================================");
  console.log("  Catalog Onboarding Completed Successfully!     ");
  console.log("=================================================\n");
}

main()
  .catch((err) => {
    console.error("\n[!] Catalog onboarding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
