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
cookie names — see `src/auth.ts` in each app), its own role gate
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

Seeded accounts (all created by `npm run db:seed`, in both Postgres and
Firebase Auth — see "Authentication" below):

| Role     | Email                     | Password       |
|----------|---------------------------|----------------|
| Admin    | admin@voltech.africa      | Admin123!      |
| Seller   | seller@voltech.africa     | Seller123!     |
| Customer | customer@voltech.africa   | Customer123!   |

## Authentication

Firebase Auth owns credentials (password hashing, sign-in, rate-limiting);
Postgres stays the source of truth for identity, role, and profile data.
`User.firebaseUid` is the only link between them. Role is stored in both
places — in Postgres for queries/joins, and as a Firebase custom claim
(`{ role, appUserId }`, set via the Admin SDK on registration/creation) so
`proxy.ts` and `auth()` can verify a session and read the role straight from
the verified claims, with no database round-trip on every request.

Flow: the client signs in with the Firebase client SDK, gets a short-lived
ID token, and POSTs it to that app's `/api/session` route, which verifies it
with the Admin SDK and mints a 14-day HttpOnly session cookie
(`createSessionCookie`) — this is what `auth()` reads on every subsequent
request. Registration is a Server Action that creates the Firebase user via
the Admin SDK, creates the matching Postgres row, and returns a custom token
for the client to sign in with (`signInWithCustomToken`) before the same
session-cookie exchange.

### Firebase setup (one-time, in the Firebase Console)

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Authentication → Settings → Authorized domains** → add each app's
   domain (`voltech-customer.onrender.com`, `voltech-seller.onrender.com`,
   `voltech-admin.onrender.com`, plus `localhost` for local dev, which is
   usually pre-added). Firebase Auth rejects client sign-in from origins not
   on this list.
3. **Project Settings → Service Accounts → Generate new private key** →
   downloads a JSON file with `project_id`, `client_email`, and
   `private_key`. Set these as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY` — locally in `.env` (each app, plus
   `packages/database/.env` for seeding), and in Render (see below). This
   is a real secret — never commit it or paste it anywhere public.
4. **Storage → Get started** (if not already enabled) — needed for the
   seller product-image and KYC-document uploads. Suggested rules:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /product-images/{uid}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid;
       }
       match /kyc-documents/{uid}/{fileName} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

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
6. Complete the Firebase Console steps under "Authentication" above if you
   haven't already, then set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   and `FIREBASE_PRIVATE_KEY` on **all three services** in the Render
   dashboard (`render.yaml` marks these `sync: false` deliberately — a
   service-account private key doesn't belong in a file in this repo).
   Login/register won't work on any app until this is done, since the
   Admin SDK throws at import time without it (same fail-loud pattern as a
   missing `DATABASE_URL`).

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
admin-approve product → live on marketplace. This was all verified before
the Firebase Auth migration; the migration preserves the exact same
`auth()` session shape everywhere (`session.user.id`/`role`), so none of
this logic itself changed — but the auth/upload plumbing itself (register →
Firebase user → session cookie → role-gated routes; file upload → Storage →
product image) still needs a live pass after the Firebase Console setup
above is complete, since none of it can be exercised without a real
Firebase project and there's no local Postgres in this environment to test
against either.

- Multi-seller cart → checkout → mock payment → order creation
- Server-side commission calculation (global/category/seller resolution order)
- Inventory reserve → fulfill on payment, with stock decremented correctly
- Append-only seller ledger (SALE / COMMISSION / ADJUSTMENT entries), pending
  → available balance release on delivery confirmation
- Seller payout request → admin approval → ledger debit
- Seller application submission → admin approval → role promotion → store live
- Product submission → admin moderation → live on the storefront

## Known gaps (by design, not oversight)

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
