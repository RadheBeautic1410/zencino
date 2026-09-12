# Zencino project notes

This application is being adapted into Zencino's multi-category commerce website. The owner's product request supersedes the inherited scaffold-only restriction.

Read [the planning index](../../docs/README.md) before implementing features. Keep storefront and admin in one Next.js application with separate routes. Reuse Postgres/Drizzle, Better Auth, pg-boss, the email outbox and useful UI components.

Implementation is now authorized phase by phase. Follow and update [the implementation tracker](../../docs/IMPLEMENTATION-PHASES.md). Use Neon PostgreSQL, reviewed versioned migrations and secret-free diagnostic output; never reset the remote database as setup. Migrate existing `/orbit` and `/dashboard` routes coherently when implementing `/admin` and `/account`. Do not assume an Amazon outbound click is a sale or share inventory with Amazon without a defined integration.
