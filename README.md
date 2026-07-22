# Castillo Auto Parts

[![CI](https://github.com/EliezerCast1llo/castillo-auto-parts/actions/workflows/ci.yml/badge.svg)](https://github.com/EliezerCast1llo/castillo-auto-parts/actions/workflows/ci.yml)

Castillo Auto Parts is a full-stack automotive parts e-commerce platform built for
El Salvador. The current MVP supports product discovery, vehicle compatibility,
guest and customer shopping flows, local fulfillment, inventory reservations, and
back-office operations.

The product is currently in local MVP validation. It is **not ready for public
commercial use** until the production gates in this README and
[`docs/production-operations-checklist.md`](docs/production-operations-checklist.md)
have been completed.

## Business Scope

- Initial service area: San Salvador and Santa Tecla.
- Currency: US dollars (USD).
- Tax: displayed prices include El Salvador's 13% VAT.
- Fulfillment: free warehouse pickup and configurable local delivery zones.
- Initial warehouse model: one active location, designed to support multiple locations.
- Checkout: guest checkout is supported; registered customers also have account pages.
- Target payment provider: Wompi El Salvador.
- Initial electronic invoicing (DTE): manual or semi-automated process pending final
  validation with an accountant and the Ministry of Finance requirements.
- Brand status: `Castillo Auto Parts` remains provisional until legal and commercial
  name clearance is complete.

## Current Features

### Customer experience

- Responsive home page, catalog, product detail, cart, and checkout.
- Search by product name, SKU, part number, brand, category, and vehicle data.
- Structured vehicle compatibility and vehicle-based catalog filtering.
- Product availability states and out-of-stock notification requests.
- Signed guest cart stored in a secure cookie.
- Quantity and stock validation on the server.
- Warehouse pickup or local delivery with a required map pin and coordinates.
- Asynchronous checkout with temporary inventory reservations.
- Mock payment confirmation for local QA.
- Customer registration, login, password recovery, account profile, saved addresses,
  and order history.
- Optional Google OAuth when credentials are configured.
- Transactional email abstraction with console and Resend providers.

### Administration

- Protected admin area with role-aware authorization.
- Order management and fulfillment status transitions.
- Product, image, inventory, and delivery settings management.
- User and role administration.
- Stock alert management.
- Administrative audit log.
- Cloudflare R2 product image storage when configured.

### Reliability and security

- Atomic inventory reservation, confirmation, release, and expiration.
- Idempotent payment event processing.
- HMAC verification for Wompi webhook events.
- Signed guest cart and order access tokens.
- Rate limiting with optional Upstash Redis support.
- Content Security Policy in report-only mode while external integrations are validated.
- Versioned Prisma migrations.
- Unit, integration, end-to-end, authorization, and responsive tests in CI.

## Technology Stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, CSS variables, Lucide icons |
| Database | PostgreSQL 16, Prisma 6 |
| Authentication | Auth.js v5, credentials, optional Google OAuth |
| Payments | Provider abstraction, local mock provider, Wompi adapter |
| Product images | Cloudflare R2 through the S3-compatible API |
| Email | Console provider for development, Resend for production |
| Validation | Zod |
| Unit tests | Vitest |
| End-to-end tests | Playwright |
| CI | GitHub Actions |
| Target hosting | Vercel with managed PostgreSQL |

## Prerequisites

- Node.js 22
- npm
- Docker Desktop with Docker Compose
- Git

External accounts are not required for the default local workflow. Wompi, Resend,
Google OAuth, Google Maps, Upstash, and Cloudflare R2 can be configured independently.

## Local Setup

1. Clone the repository and enter the project directory:

```bash
git clone https://github.com/EliezerCast1llo/castillo-auto-parts.git
cd castillo-auto-parts
```

2. Install dependencies:

```bash
npm install
```

3. Create the local environment file:

```bash
cp .env.example .env
```

Review every placeholder in `.env`. Keep local secrets out of Git.

4. Start PostgreSQL:

```bash
docker compose up -d postgres
docker compose ps
```

Wait until `castillo-auto-parts-postgres` reports a healthy status.

5. Generate Prisma Client, apply migrations, and seed local data:

```bash
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
```

If the local database predates the migration baseline, read
[`docs/database-migrations.md`](docs/database-migrations.md) before applying migrations.

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin access is created from `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` when the
seed command runs. Customer accounts can be created from `/auth/register`.

## Database and Mock Data Safety

PostgreSQL is the source of truth for products, stock, customers, carts, orders, and
payments.

In development and test environments, catalog pages may fall back to mock products
when PostgreSQL is unavailable. This keeps UI work possible, but it can make the site
look healthy while the database is down. Account, order, inventory, and checkout flows
still require PostgreSQL.

Mock catalog fallback is disabled when `NODE_ENV=production`. Before launch, a
controlled preproduction test must confirm that a database outage produces an explicit
unavailable state and never exposes mock products, prices, filters, or stock as real
inventory.

Useful local database checks:

```bash
docker compose ps
docker compose logs postgres
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

## Payments

The default local configuration uses `PAYMENT_PROVIDER=mock`. It presents an explicit
development-only payment screen and exercises the same idempotent payment event and
inventory confirmation path used by a real webhook.

The repository includes a Wompi adapter and `/api/webhooks/wompi`, but real sandbox and
production transactions have not yet been validated with merchant credentials. The
application blocks the mock payment provider in production.

Do not enable real sales until all of the following are complete:

- Wompi merchant onboarding and sandbox credentials.
- Approved, declined, duplicate, delayed, and invalid-signature webhook tests.
- Amount, reference, environment, and inventory reconciliation checks.
- Production webhook registration and reservation-expiration scheduler.
- Refund, reversal, and operational reconciliation procedures.
- Approved DTE workflow.

See [`docs/phase-2-payments-inventory.md`](docs/phase-2-payments-inventory.md) for the
implemented flow and remaining validation.

## Quality Checks

Run the same checks used by CI before opening a pull request:

```bash
npm run prisma:generate
npx prisma validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` creates an isolated PostgreSQL schema, applies migrations, seeds it,
builds the application, runs Playwright on port `3100`, and removes the schema when it
finishes. Use `npm run test:e2e:raw` only when intentionally debugging against the
currently configured database and server.

GitHub Actions runs two required jobs:

- `quality`: Prisma validation, migrations, seed, lint, typecheck, unit tests, and build.
- `e2e`: isolated PostgreSQL plus Playwright Chromium tests.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm start` | Start a previously built application |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run isolated database setup and Playwright tests |
| `npm run test:e2e:raw` | Run Playwright against the current environment |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run db:migrate:dev` | Create and apply a development migration |
| `npm run db:migrate:deploy` | Apply committed migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:seed` | Seed the configured database |

## Project Structure

```text
src/
  app/          Next.js routes, server actions, and API handlers
  components/   Customer, account, admin, and shared UI
  data/         Catalog queries, filters, and development fixtures
  lib/          Auth, payments, inventory, email, storage, and business rules
  types/        Shared TypeScript declarations
prisma/         Database schema, migrations, and seed
scripts/        Local and CI automation
tests/e2e/      Playwright customer and admin journeys
docs/           Product, architecture, QA, audit, and operations documentation
```

## Production Gates

The following remain mandatory before a public commercial launch:

- Managed PostgreSQL with pooled runtime and direct migration URLs.
- Database outage monitoring, backups, and a tested restore procedure.
- Wompi sandbox and production validation with real merchant credentials.
- Production reservation-expiration scheduler.
- Resend domain verification with SPF, DKIM, and DMARC.
- Cloudflare R2 production bucket, custom public domain, and least-privilege token.
- Distributed rate limiting for sensitive serverless flows.
- CSP review followed by enforcement.
- Final Google Maps or address provider configuration and delivery-zone validation.
- Approved DTE, refund, cancellation, warranty, and delivery policies.
- Legal and commercial clearance for the final brand name.

Do not treat a successful local mock checkout as production payment approval.

## Core Documentation

- [`docs/mvp-current-status.md`](docs/mvp-current-status.md): current implementation status.
- [`docs/product-requirements.md`](docs/product-requirements.md): business and product rules.
- [`docs/technical-architecture.md`](docs/technical-architecture.md): system architecture.
- [`docs/project-file-map.md`](docs/project-file-map.md): repository ownership map.
- [`docs/qa-checklists.md`](docs/qa-checklists.md): manual QA coverage.
- [`docs/ci-cd-quality-gates.md`](docs/ci-cd-quality-gates.md): CI and merge requirements.
- [`docs/database-migrations.md`](docs/database-migrations.md): migration workflow.
- [`docs/production-operations-checklist.md`](docs/production-operations-checklist.md): launch checklist.
- [`docs/learning-file.md`](docs/learning-file.md): durable project decisions and lessons.

Historical phase documents remain in `docs/` for traceability, but the current-status,
operations, and learning documents take precedence when older decisions conflict.

## Contribution Workflow

1. Create a focused feature branch.
2. Keep business logic changes separate from visual-only changes when practical.
3. Update tests and documentation for behavioral changes.
4. Run the local quality checks.
5. Open a pull request and wait for both GitHub Actions jobs to pass.
6. Complete the relevant manual QA checklist before merging.

Never commit `.env`, production credentials, customer data, payment secrets, or exported
database contents.
