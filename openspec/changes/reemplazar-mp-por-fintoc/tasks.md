# Tasks: Reemplazar Mercado Pago por Fintoc

## Phase 1: Database, Types & Dependencies

- [x] 1.1 Create `supabase/migrations/20260531000001_rename_payment_columns.sql` — `ALTER TABLE orders RENAME COLUMN mp_preference_id TO payment_session_id; ALTER TABLE orders RENAME COLUMN mp_payment_id TO payment_intent_id;` preserves existing data
- [x] 1.2 Update `types/index.ts` — rename `mp_preference_id` → `payment_session_id`, `mp_payment_id` → `payment_intent_id` on `Order` type; change `CheckoutResponse` to `{ redirectUrl }` replacing `{ preferenceId, initPoint }`
- [x] 1.3 Edit `package.json` — remove `"mercadopago"` from dependencies, add `"fintoc"` (run `npm uninstall mercadopago && npm install fintoc`)

## Phase 2: Fintoc SDK Wrapper

- [x] 2.1 Create `lib/fintoc.ts` — thin wrapper: `new Fintoc(FINTOC_SECRET_KEY)` at module level, exported `createCheckoutSession({ orderId, amount, customerEmail })` calls `fintoc.checkoutSessions.create()` with `CLP`, `success_url`, `cancel_url`, `metadata: { order_id }`, returns `{ sessionId, redirectUrl }`

## Phase 3: Core Backend — Checkout Action

- [x] 3.1 Create `lib/actions/checkout.ts` — nueva Server Action con `'use server'`: validación, stock, orden + items (misma lógica del Route Handler actual), luego `createCheckoutSession()` de Fintoc, guarda `payment_session_id`, devuelve `{ success: true, redirectUrl }` en éxito o `{ error, failedItems }` en falla
- [x] 3.2 Modify `app/(store)/checkout/page.tsx` — reemplazar `fetch('/api/checkout')` por `useActionState(checkoutAction, ...)`, leer `redirectUrl` en vez de `initPoint`, redirigir con `window.location.href = redirectUrl`
- [x] 3.3 Delete `app/api/checkout/route.ts` — ya no es necesario, reemplazado por Server Action

## Phase 4: Webhook Endpoint

- [x] 4.1 Delete `app/api/webhooks/mercadopago/` directory entirely
- [x] 4.2 Create `app/api/webhooks/fintoc/route.ts` — handle `checkout_session.finished` (status `approved`, save `payment_intent_id`, decrement stock via RPC, send confirmation email), `payment_intent.failed` (status `rejected`, save `payment_intent_id`); idempotency: skip if `payment_intent_id` already set; return 200 on unknown/malformed

## Phase 5: Testing

- [x] 5.1 Create `lib/__tests__/actions/checkout.test.ts` — mock `@/lib/fintoc` instead of `@/lib/mercadopago`; stub `createCheckoutSession` returning `{ sessionId, redirectUrl }`; assert `payment_session_id` saved, `redirectUrl` returned; keep all existing test cases
- [x] 5.2 Create `lib/__tests__/actions/webhooks-fintoc.test.ts` — test: `checkout_session.finished` updates order + decrements stock + sends email; duplicate event idempotency; `payment_intent.failed` sets rejected; unknown `order_id` logs warning; malformed payload returns 200

## Phase 6: Cleanup

- [x] 6.1 Delete `lib/mercadopago.ts` — entire Mercado Pago wrapper file
- [x] 6.2 Update `.env.local` — remove `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_MP_PUBLIC_KEY`; add `FINTOC_SECRET_KEY` and `FINTOC_WEBHOOK_SECRET`

## Dependencies

```
1.1 (migration) → 1.2 (types), 1.3 (npm) → 2.1 (fintoc wrapper)
                                                           ↓
                                              3.1 (checkout SA) → 3.2 (page) → 3.3 (delete route)
1.1 → 1.2 → 4.2 (fintoc webhook)
3.1 + 3.2 → 5.1 (checkout tests)
4.2 → 5.2 (webhook tests)
6.1, 6.2, 3.3 = cleanup, order-independent
```
