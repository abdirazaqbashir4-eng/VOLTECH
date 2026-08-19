# VOLTECH Marketplace

A multi-vendor e-commerce marketplace: three independent Next.js applications (customer storefront, seller center, admin dashboard) sharing a database and a business-logic package.

## Architecture

```
apps/
  customer/   buyer marketplace          — npm run dev:customer  → http://localhost:3010
  seller/     seller onboarding + center — npm run dev:seller    → http://localhost:3001
  admin/      marketplace administration — npm run dev:admin     → http://localhost:3002
packages/
  database/   Prisma schema + generated client (@voltech/database)
  core/       shared enums, money/id helpers, payment abstraction, and all
              marketplace business logic — commission, inventory, cart,
              checkout, ledger, payouts, reviews (@voltech/core)
```

Each app is a separate Next.js deployment with its own auth session (distinct
cookie names — see `src/auth.config.ts` in each app), its own role gate
(`requireSeller` / `requireAdmin`), and its own `proxy.ts` (Next 16's renamed
`middleware.ts`) for route protection. A customer can never reach seller or
admin routes and vice versa — enforced both at the proxy layer and again
inside every page/server action, per the "never trust the client" rule for
money, stock, and permissions.

Business logic (commission resolution, inventory reservation/fulfillment,
the append-only seller ledger, order splitting, payment abstraction) lives
once in `packages/core/src/marketplace/*` and is imported by whichever app
needs it — never duplicated per app.

## Running locally

Needs a real PostgreSQL connection string — there's no bundled local
database. Point `DATABASE_URL` (in `packages/database/.env` and in each
app's `.env`) at either a local Postgres (e.g. `docker run -e
POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`) or the same Render Postgres
used in production (fine before you have real users; not after).

```bash
npm install
npm run db:migrate   # applies packages/database/prisma/migrations
npm run db:seed      # seeds categories, shipping zones, commission rule,
                      # an admin, a seller with 3 products, and a customer
                      # — DO NOT run this against a real production database,
                      # it creates well-known admin/seller/customer passwords

npm run dev:customer   # in one terminal → http://localhost:3010
npm run dev:seller     # in another      → http://localhost:3001
npm run dev:admin      # in another      → http://localhost:3002
```

Seeded accounts (all created by `npm run db:seed`):

| Role     | Email                     | Password       |
|----------|---------------------------|----------------|
| Admin    | admin@voltech.africa      | Admin123!      |
| Seller   | seller@voltech.africa     | Seller123!     |
| Customer | customer@voltech.africa   | Customer123!   |

## Database

PostgreSQL (see `packages/database/prisma/schema.prisma`). Enum-like fields
are modeled as validated strings (see `packages/core/src/enums.ts`) rather
than native Postgres enums — a deliberate simplicity choice, not a
constraint of the database.

Every page in all three apps is explicitly `export const dynamic =
"force-dynamic"` (set once in each app's root `layout.tsx`) — nothing is
statically prerendered. This matters for two reasons: a marketplace's stock
and pricing must always be current, and it means `next build` never needs a
reachable database, only `next start` does.

## Deploying to Render

`render.yaml` at the repo root is a Render Blueprint: it provisions one
shared Postgres database and the three web services in one shot.

1. Push this repo to GitHub (already connected to
   `github.com/abdirazaqbashir4-eng/VOLTECH`).
2. In the Render dashboard: **New +** → **Blueprint** → select this repo →
   Render reads `render.yaml` and shows all four resources (1 database + 3
   services) before creating anything — review and apply.
3. First deploy takes a few minutes. The `voltech-customer` service's build
   also runs `prisma migrate deploy` against the shared database (only one
   service needs to — migrations aren't re-applied on every deploy of every
   service). `voltech-seller` and `voltech-admin` may briefly 500 on their
   very first requests if they start serving before that migration
   finishes — retry after a minute if so.
4. Once live, optionally seed data via Render's **Shell** tab on the
   `voltech-customer` service: `npm run db:seed` — again, only for a demo,
   never against data you care about, since it creates accounts with known
   passwords (see table above).
5. Read the free-tier notes at the top of `render.yaml` before relying on
   this for anything real — free Postgres expires after 30 days, and free
   web services spin down when idle.

`AUTH_SECRET` is auto-generated per service by the Blueprint.
`NEXTAUTH_URL` is intentionally not set — each app's `auth.config.ts` sets
`trustHost: true`, which is what Auth.js v5 needs outside Vercel (Render
included) instead.

## Payments

`packages/core/src/payments/` defines a provider-agnostic interface
(`PaymentProviderAdapter`). Checkout and order code depend only on that
interface, never on a specific provider's API shape. A `MOCK` provider
settles instantly so the full checkout → payment → commission → payout
pipeline can be exercised without real credentials. `mpesa.ts` and `card.ts`
are real integration points that throw a clear "not configured" error until
their required env vars (see `.env.example` in each app) are set — they were
intentionally left unimplemented rather than faked, since a working Daraja
STK push or hosted card checkout needs real provider credentials this build
doesn't have.

## What's genuinely verified

Every piece of financial and inventory logic below was exercised through
the actual running apps (not just written), including a full seller
onboarding cycle: register → apply → admin-approve → create product →
admin-approve product → live on marketplace.

- Multi-seller cart → checkout → mock payment → order creation
- Server-side commission calculation (global/category/seller resolution order)
- Inventory reserve → fulfill on payment, with stock decremented correctly
- Append-only seller ledger (SALE / COMMISSION / ADJUSTMENT entries), pending
  → available balance release on delivery confirmation
- Seller payout request → admin approval → ledger debit
- Seller application submission → admin approval → role promotion → store live
- Product submission → admin moderation → live on the storefront

## Known gaps (by design, not oversight)

- **File uploads**: seller KYC docs and product images are URL fields (paste
  a link), not a real upload pipeline — no object storage (S3/Cloudinary) is
  wired up. Documented explicitly in the seller apply form.
- **Coupon management UI**: the `Coupon` model, checkout redemption, and
  discount calculation are fully implemented and wired into checkout, but
  there's no admin/seller UI to *create* coupons yet — only promotions have
  a UI. Coupons can be created directly via `npm run db:studio` in the
  meantime.
- **No automated test suite**: correctness of money/stock logic was verified
  through live end-to-end runs (see above), not unit tests. Given the
  emphasis on this in the spec, a real next step would be Vitest coverage
  for `packages/core/src/marketplace/{orders,inventory,ledger,commission}.ts`.
- **No SEO sitemap.xml / robots.txt** generated yet, though pages carry
  metadata, canonical URLs, and Product JSON-LD.
- **Typo-tolerant search**: search uses SQL `contains` matching, not a real
  fuzzy/trigram search — a Postgres migration could add `pg_trgm`, or a
  dedicated search service (Meilisearch/Typesense) for production scale.
