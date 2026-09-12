# Development and Neon

Use Node 22.12 or newer compatible with the installed packages and the package manager declared in `package.json`. Run commands from the application directory.

## Configuration

Keep `.env` local and ignored. `DATABASE_URL` is the web connection, normally Neon's pooled URL. `DATABASE_URL_UNPOOLED` optionally overrides the migration/worker connection. For Neon hosts, the code derives the direct endpoint by removing the documented `-pooler` hostname suffix; it preserves credentials, database and query parameters. Other providers' hosts are left unchanged.

The web client has a five-connection limit per process; the worker has three pg-boss connections plus its ORM pool. Web enqueue clients allow two pg-boss connections per process. Size total deployment instances against the Neon compute connection limit before production. A polling worker may keep compute active; verify the selected plan's operating costs.

Migrations and worker use direct connections to avoid transaction-pool session restrictions. This follows [Neon connection guidance](https://neon.com/docs/connect/connection-pooling). The installed pg-boss package/API is verified by the worker smoke test, rather than assuming documentation for a different release applies.

`APP_SECRET` must be a random string of at least 32 characters; never reuse a placeholder. `NEXT_PUBLIC_APP_URL` is the site's origin. `CHECKOUT_ENABLED=false` is the initial setting; future checkout handlers must call the server-only guard. Never enable checkout until launch validation.

## Commands

```text
pnpm install --frozen-lockfile
pnpm db:check
pnpm db:migrate
pnpm worker:check
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`db:check` performs a read-only connection/table check. `db:migrate` applies versioned SQL and records migration history without resetting data. `worker:check` starts real registered handlers, executes a healthcheck, then closes the worker/client; use it in development/staging, because scheduled handlers are active during the check.

If the desktop-provided pnpm wrapper attempts another installation when running commands, the installed scripts can be run directly using Node (for example `node node_modules/tsx/dist/cli.mjs scripts/check-db.ts`). This does not bypass network/subprocess permissions; those still apply.

## Email and environments

Without SMTP, local development prints email including magic links to the local terminal. Do not share those logs. Production refuses the fallback and requires SMTP_HOST, SMTP_USER, SMTP_PASS and EMAIL_FROM. Port 465 uses implicit TLS. Real SMTP delivery must be checked when credentials are provided; a logged message is not proof of delivery.

Use separate Neon branches/databases, secrets, email delivery destinations and provider credentials for development, staging and production. The supplied empty database is being used for initial development; no separate staging/production branches have been provisioned by this task. Review migrations on an isolated database before promoting them and test backup restoration before launch.
