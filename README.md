# Zencino website

One Next.js application for the planned Zencino multi-category storefront and admin panel. Current code contains reusable authentication, account, admin, database, email and worker infrastructure. Commerce is not implemented yet.

Start with the [detailed project plan](../../docs/README.md) for screens, schema, workflows, assets and delivery phases.

## Current foundation

Next.js App Router, React, TypeScript/Tailwind, PostgreSQL/Drizzle, Better Auth magic links, pg-boss and a durable SMTP email outbox. Existing account routes use `/dashboard`, and operational admin uses `/orbit`; planned destinations are `/account` and `/admin`.

## Local setup

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:local
```

Keep the database process running. In another terminal:

```powershell
pnpm db:migrate
pnpm dev
```

Configure a real random application secret in `.env`. Open `http://localhost:3000`, sign in, then promote the intended owner using `pnpm make:admin you@example.com`. Never commit real environment files.

Without SMTP configuration, the worker logs email in development; configure delivery before production. See [commands](docs/commands.md). Product source assets belong in the workspace `amazon/` folder. The Z mark is an interim placeholder.
