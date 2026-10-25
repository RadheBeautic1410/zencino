import { existsSync } from "node:fs";
import postgres from "postgres";
import { directPgConnectionString } from "../lib/pg-connection";

if (existsSync(".env")) {
  process.loadEnvFile();
}

/**
 * Inserts starter blog posts as DRAFTS (never overwrites an existing slug).
 * Review them in /admin/blog and set status to Published when ready.
 * Run after `pnpm db:migrate`:  pnpm tsx scripts/seed-blog.ts
 */
const POSTS = [
  {
    slug: "how-to-clean-and-care-for-acrylic-products",
    title: "How to Clean and Care for Acrylic Products",
    excerpt:
      "Keep your acrylic organizers and dispensers crystal clear for years with these simple dos and don'ts.",
    seoTitle: "How to Clean Acrylic Products Without Scratches | Zencino",
    seoDescription:
      "Learn the safe way to clean acrylic organizers, dispensers and storage boxes: the right cloth, the right cleaner, and what to avoid.",
    body: `Acrylic looks like glass but behaves very differently. It is lighter, harder to shatter and far more flexible, yet it scratches more easily and reacts badly to some cleaners. A few minutes of the right care keeps it looking brand new.

## What you need

- A soft microfiber cloth
- Lukewarm water
- A drop of mild dish soap

## Step by step

- Dust the surface first with a dry microfiber cloth so grit does not scratch the acrylic when you wipe.
- Mix a few drops of mild soap in lukewarm water and dampen the cloth.
- Wipe gently in straight lines, not hard circles.
- Rinse with a clean damp cloth and pat dry with a second soft cloth.

## What to avoid

- Glass cleaners containing ammonia or alcohol, which can cloud and crack acrylic over time.
- Paper towels, rough sponges and scouring pads, which leave fine scratches.
- Hot water or direct heat, which can warp the material.

## Removing light scratches

For very fine surface scratches, a small amount of plastic polish applied with a soft cloth can restore clarity. Test on a hidden corner first.

## Quick tip

Wipe your organizers once a week. Regular light cleaning is far easier on acrylic than an occasional heavy scrub.`,
  },
  {
    slug: "5-smart-ways-to-organize-your-kitchen-with-clear-storage",
    title: "5 Smart Ways to Organize Your Kitchen with Clear Storage",
    excerpt:
      "Clear containers and dispensers make a small kitchen feel bigger and save time every single day.",
    seoTitle: "5 Kitchen Organization Ideas Using Clear Storage | Zencino",
    seoDescription:
      "Simple kitchen organization ideas using clear acrylic and plastic storage: pantry, countertop, fridge and cleaning supplies.",
    body: `A cluttered kitchen slows you down. Clear storage solves this because you can see what you have at a glance, so nothing gets lost at the back of a shelf and nothing gets bought twice.

## 1. Decant pantry staples

Move rice, pulses, flour and snacks into clear, labelled containers. You will instantly see when something is running low, and the shelf looks tidy.

## 2. Use a dispenser for liquids

A tap-style dispenser for laundry or dish liquid avoids drips and heavy bottles. It also keeps the countertop clean.

## 3. Group by use, not by size

Keep baking items together, tea and coffee together, and daily-use spices closest to the stove.

## 4. Organize the fridge

Shallow clear bins let you pull out a whole group, like sauces or dairy, in one go instead of searching the shelf.

## 5. Make the most of vertical space

Stackable boxes and tiered organizers turn unused height into extra storage without crowding your counter.

## Start small

Pick one shelf or one drawer this weekend. Once you see the difference, the rest of the kitchen follows naturally.`,
  },
  {
    slug: "why-clear-acrylic-is-a-great-choice-for-home-and-office",
    title: "Why Clear Acrylic Is a Great Choice for Home and Office",
    excerpt:
      "Lightweight, durable and good-looking: here is why acrylic organizers are worth it.",
    seoTitle: "Why Choose Acrylic Organizers for Home and Office | Zencino",
    seoDescription:
      "Acrylic is lightweight, shatter resistant and stylish. See why clear acrylic organizers suit homes, desks and kitchens.",
    body: `Acrylic has become a favourite for organizers, and for good reason. It combines the clean look of glass with practical everyday strength.

## Clarity that lasts

Good acrylic lets light through almost as well as glass, so your things stay visible and displays look sharp.

## Lighter and safer

Acrylic is far lighter than glass and does not shatter into sharp pieces, which makes it a sensible choice for kitchens, kids' rooms and busy desks.

## Easy to live with

A simple wipe with a soft cloth is all most pieces need. It does not rust, and it does not absorb odours like some plastics.

## Fits any space

- Desk: pen stands, drawer trays and document holders
- Kitchen: containers, dispensers and shelf organizers
- Bathroom and bedroom: makeup and accessory storage

## Buying tips

- Look for thick, evenly polished edges.
- Check that lids and taps fit snugly.
- Choose sizes that match what you actually store.

Browse our range and pick the pieces that make your space calmer and easier to use.`,
  },
];

async function main() {
  const connection = process.env.DATABASE_URL;
  if (!connection) {
    throw new Error("DATABASE_URL is missing");
  }
  const sql = postgres(
    directPgConnectionString(process.env.DATABASE_URL_UNPOOLED || connection),
    { max: 1, connect_timeout: 15 }
  );
  try {
    for (const p of POSTS) {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const res = await sql`
        INSERT INTO blog_posts (id, slug, title, excerpt, body, seo_title, seo_description, status)
        VALUES (${id}, ${p.slug}, ${p.title}, ${p.excerpt}, ${p.body}, ${p.seoTitle}, ${p.seoDescription}, 'draft')
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug`;
      console.log(
        res.length ? `Created draft: ${p.slug}` : `Skipped (exists): ${p.slug}`
      );
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
