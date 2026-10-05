# Recharge shop

## Deployment

Apply `supabase/migrations/20261004000001_recharge_shop.sql` through the project's
normal Supabase migration workflow before deploying the updated frontend. Review
the pending migration list first: this workspace may contain other undeployed work.

The migration copies every existing profile's current points into a private wallet
once and records an opening transaction. It does not reconstruct previously revoked
points. New profile awards and corrections automatically update the wallet through
a database trigger, including grievance and Diamond awards.

The promotion starts **disabled**. No live banking integration or credentials are
configured or required.

## Launch as superadmin

Open **Dashboard → Shop & Promotion**:

1. Review the four initial B-Mobile/TashiCell data and talk-time cards. Confirm
   package availability and talk-time limits in your recharge app. Operator reference
   pages: <https://www.bt.bt/mobile/prepaid/> and
   <https://www.tashicell.com/mobile-services/prepaid-data-plans>.
2. Set the Ngultrum value of one point (initially Nu. 1). Up to four decimal places
   are supported. Redemptions spend whole points and deliver whole Ngultrum values;
   unsupported fractional results are rejected rather than rounded.
3. Set each card to either use the promotion rate or have its own fixed point cost
   and recharge value. A fixed data card must match an enabled package amount.
4. Set start/end dates in **Bhutan time (UTC+06:00)**, delivery information, and enable
   the promotion. There is no total campaign spending cap.

The four internal operator/type records power the single Mobile Recharge form.
Their limits and package amounts live under collapsed **Mobile recharge settings**;
there is no separate public card or "Add card" action for each combination.

Disabling the promotion pauses new requests. Editing its dates or prices does not
change accepted requests. Unspent wallet points remain after the promotion ends.

## Fulfilment

The user reviews their number and price, then submits a request. The database locks
their wallet, checks eligibility and current catalogue versions, and atomically
deducts points and stores the request. A request UUID makes same-request retries
idempotent.

In the superadmin queue:

1. Mark a pending request **Processing**.
2. Manually recharge the exact number/type/value through your recharge app.
3. Record the bank reference and confirm **Delivered**.
4. If no recharge succeeded or remains pending, enter a reason and **Cancel & refund**.

For an uncertain bank result, keep the request Processing until reconciled. A
delivered/refunded request is final. Repeating an action cannot deduct or refund
points again. Users see their own request history and fulfilment notes.

The in-app bell notifies requesters on submission, processing, delivery, and
refund, and superadmins when a request arrives. Tapping a notification opens
that exact private request, even when it is not on the first list page. Alerts
never include full phone numbers or bank references.

## Points and privacy

- `profiles.points`: total contribution points for rankings; redemption never changes it.
- `point_wallets.balance`: private redeemable balance. Negative corrections are retained
  as a shortfall against future earnings; available spend is displayed as zero.
- `point_transactions`: opening, earning, correction, redemption and refund ledger.
- `shop_redemptions`: private full phone numbers, pricing snapshots and bank references.
- `shop_recent_deliveries()`: a narrow public projection, limited to the ten most recent
  delivered requests, without opt-out. Only masked numbers, operator,
  reward type/value and delivery time are returned.

The public `/shop` page keeps the original paginated reward cards and has a
pale-yellow recent-deliveries panel immediately below pagination. Each card opens
`/shop/:slug`: mobile recharge shows its request form, rates, and private history;
the other rewards show a coming-soon detail page until implemented. The recent
rewards panel accepts a custom public reward label when additional reward types
become available; each future reward still needs a private fulfilment flow before
it can appear publicly. Visitors can browse without login; redemption and personal
balances require login.
Superadmin permissions are enforced in SQL, not just by hiding dashboard controls.

## Verification

```sh
npm test
npm run lint
npm run build
```

`supabase/tests/shop_permissions.sql` runs with `supabase test db` on an available
local Supabase stack after migration.

For an isolated PostgreSQL-compatible smoke test, install `@electric-sql/pglite`
in a temporary directory and run:

```sh
node scripts/check-shop-db.mjs /absolute/path/to/node_modules/@electric-sql/pglite/dist/index.js
```

That test executes the actual migration against minimal pre-existing schema fixtures
and verifies balances, retries, role isolation, masking, refunds, expiry, pricing and
award corrections. It does not replace testing against the complete deployed Supabase
schema or concurrent connections on a real PostgreSQL server.
