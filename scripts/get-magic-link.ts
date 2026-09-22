import { existsSync } from "node:fs";
import { desc } from "drizzle-orm";
import { emailOutbox } from "../db/schema/email-outbox";
import { db } from "../lib/db";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  const targetEmail = process.argv[2] || "tavethiyasahaj4356@gmail.com";

  console.log(`Looking up latest magic link email for: ${targetEmail}...\n`);

  const emails = await db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(20);

  const matched = emails.find((e) => {
    const to = e.payload?.to;
    return (
      typeof to === "string" && to.toLowerCase() === targetEmail.toLowerCase()
    );
  });

  if (!matched?.payload) {
    console.log(`No sign-in emails found for ${targetEmail}.`);
    console.log(
      "Go to http://localhost:3000/login and request a sign-in link first."
    );
    process.exit(0);
  }

  const text = matched.payload.text || "";
  const match = text.match(/(http:\/\/[^\s\n]+)/);

  if (match) {
    console.log("=========================================================");
    console.log("             ZENCINO 1-CLICK SIGN-IN LINK               ");
    console.log("=========================================================");
    console.log(`\nEmail: ${targetEmail}`);
    console.log(`Sent:  ${matched.createdAt.toISOString()}`);
    console.log("\nClick or paste this link into your browser:\n");
    console.log(`👉  ${match[1]}\n`);
    console.log("=========================================================");
  } else {
    console.log(
      "Found email, but could not parse verification URL from text payload."
    );
    console.log(text);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error retrieving magic link:", err);
  process.exit(1);
});
