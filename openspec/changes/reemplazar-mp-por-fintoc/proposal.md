# Proposal: Reemplazar Mercado Pago por Fintoc

## Intent

Replace Mercado Pago Checkout Pro with Fintoc as the payment gateway. Fintoc sends money directly to the merchant's Chilean bank account (~1% fee, no wallet retention), supports all Chilean banks + prepaid cards, and is simpler to integrate than MP.

## Scope

### In Scope
- Fintoc SDK integration (`lib/fintoc.ts`): create checkout sessions
- Rewrite `lib/actions/checkout.ts` to call Fintoc instead of MP
- Replace webhook route `app/api/webhooks/mercadopago/route.ts` → `app/api/webhooks/fintoc/route.ts`
- Database migration: rename `mp_preference_id` → `payment_session_id`, `mp_payment_id` → `payment_intent_id` (generic for future Flow.cl)
- Update `types/index.ts`, `.env.local`
- Update all 18 checkout tests + add webhook tests
- Remove `mercadopago` npm dependency; install `fintoc`

### Out of Scope
- Flow.cl integration (deferred to future change)
- UI changes to checkout page (user flow is identical: form → redirect → result)
- Multi-payment-gateway support

## Approach

1. **New file `lib/fintoc.ts`** — thin wrapper around Fintoc SDK, exposes `createCheckoutSession(orderId, items, customer)` returning `{ sessionId, redirectUrl }`
2. **Rewrite `lib/actions/checkout.ts`** — replace `createPreference()` call with Fintoc's `createCheckoutSession()`, save `payment_session_id` to order
3. **New webhook route** — handle `checkout_session.finished` / `payment_intent.succeeded` events; same logic (update order, decrement stock via RPC, send email)
4. **Database migration** — rename columns via `ALTER TABLE orders RENAME COLUMN`; remove old MP columns
5. **Tests** — mock `fintoc.checkoutSessions.create` instead of `createPreference`; add webhook handler tests
6. **Env** — swap `MP_*` for `FINTOC_SECRET_KEY`, `FINTOC_WEBHOOK_SECRET`

## Affected Areas

| File | Change | What |
|------|--------|------|
| `lib/mercadopago.ts` | **Remove** | Entire file, replaced by Fintoc |
| `lib/fintoc.ts` | **New** | Fintoc SDK wrapper |
| `lib/actions/checkout.ts` | **Modify** | Replace MP calls with Fintoc; return `redirectUrl` instead of `initPoint` |
| `lib/actions/checkout.test.ts` | **Modify** | Mock Fintoc; update assertions |
| `app/api/webhooks/mercadopago/route.ts` | **Remove** | Replaced by Fintoc webhook |
| `app/api/webhooks/fintoc/route.ts` | **New** | Handle Fintoc events |
| `types/index.ts` | **Modify** | Rename `mp_preference_id` → `payment_session_id`, `mp_payment_id` → `payment_intent_id` |
| `.env.local` | **Modify** | Remove `MP_*` vars, add `FINTOC_*` vars |
| DB migration | **New** | Rename columns + clean up |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Webhook events arrive before checkout redirect resolves | Med | Mark orders `pending`; idempotency check on `payment_intent_id` |
| Fintoc test mode differs from production | Low | Use Fintoc test credentials (RUT 41614850-3) during dev; validate in staging |
| Existing `pending` orders with MP references become orphaned | Low | Leave old columns data intact until migration; MP references readable in `metadata` |

## Rollback Plan

1. Revert git changes: `git revert HEAD` on deployment
2. Restore `.env.local` with MP credentials
3. Run reverse DB migration: `ALTER TABLE orders RENAME COLUMN payment_session_id TO mp_preference_id` etc.
4. Restore `lib/mercadopago.ts`, `lib/actions/checkout.ts`, webhook route from git history
5. Run existing MP test suite to verify

## Success Criteria

- [ ] Checkout creates Fintoc session, saves `payment_session_id`, returns `redirectUrl`
- [ ] Webhook receives `checkout_session.finished`, updates order to `approved`, decrements stock, sends email
- [ ] All existing checkout tests pass (updated mocks)
- [ ] `pnpm build` passes
- [ ] Old MP columns removed from schema, old env vars removed from `.env.local`
