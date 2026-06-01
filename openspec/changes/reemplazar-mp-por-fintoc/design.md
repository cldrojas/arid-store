# Design: Reemplazar Mercado Pago por Fintoc

## Technical Approach

Thin SDK wrapper (`lib/fintoc.ts`) → replace one `createPreference()` call in checkout action → rewrite webhook handler for Fintoc events → rename DB columns to payment-agnostic names. Zero UI changes. Same idempotency + stock + email flow.

## Architecture Decisions

| Decision | Options | Chosen | Rationale |
|----------|---------|--------|-----------|
| Wrapper pattern | Direct SDK in checkout vs thin wrapper | Thin wrapper `lib/fintoc.ts` | Keeps checkout action diff minimal; SDK swap isolated in one file; same pattern as removed `lib/mercadopago.ts` |
| Column rename strategy | `ALTER RENAME` vs add+drop cols | `ALTER RENAME COLUMN` | Existing rows keep their data; no null periods; reversible |
| Webhook verification | Middleware vs inline | Inline in route handler | Single webhook endpoint; no need for extra abstraction |
| Return type | `redirectUrl` vs id+url | `{ sessionId, redirectUrl }` | Client needs only URL to redirect; sessionId saved on order server-side |
| Checkout pattern | Route Handler vs Server Action | **Server Action** (`lib/actions/checkout.ts`) | Prefer Server Actions for mutations from UI; type-safe, progressive enhancement, no API layer needed |
| Client invocation | `fetch()` vs form action | **Form action / direct call** | El cliente llama a la Server Action directamente, no pasa por HTTP route |
| Test mock target | Mock `fintoc` module vs mock http | `vi.mock('@/lib/fintoc', ...)` | Same pattern as current MP mock; Vitest hoisting works out of the box |

## Data Flow

```
Browser (Client)     Server Action          Supabase          Fintoc API
     │                  │                      │                 │
     │── form submit ──▶│ (useActionState)     │                 │
     │  checkoutAction()│                      │                 │
     │                  │── verify stock ─────▶│                 │
     │                  │◀─ variants ──────────│                 │
     │                  │── INSERT order ─────▶│                 │
     │                  │── INSERT items ─────▶│                 │
     │                  │── createCheckoutSession() ──────────▶ │
     │                  │◀─ { sessionId, redirectUrl } ─────────│
     │                  │── UPDATE payment_session_id ────────▶│
     │◀─ { redirectUrl }│                                      │
     │                  │                                      │
     │══ redirect to Fintoc checkout ─────────────────────────▶│
     │                  │         (user pays on Fintoc)         │
     │                  │                                      │
     │                  │◀─ Webhook POST /api/webhooks/fintoc   │
     │                  │    checkout_session.finished          │
     │                  │── SELECT order (idempotency) ───────▶│
     │                  │── UPDATE status, payment_intent_id ─▶│
     │                  │── RPC decrement_stock ──────────────▶│
     │                  │── sendOrderConfirmation ── Resend     │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/mercadopago.ts` | **Delete** | Entire file, replaced by Fintoc |
| `lib/fintoc.ts` | **Create** | Thin wrapper, exports `createCheckoutSession()` |
| `lib/actions/checkout.ts` | **Create** | Nueva Server Action con `'use server'`: validación, stock, orden, Fintoc session, guarda `payment_session_id`, devuelve `{ redirectUrl }` |
| `app/api/checkout/route.ts` | **Delete** | Era Route Handler, reemplazado por Server Action |
| `lib/__tests__/actions/checkout.test.ts` | **Modify** | Mock `@/lib/fintoc` instead of `@/lib/mercadopago`; update assertions |
| `app/api/webhooks/mercadopago/route.ts` | **Delete** | Replaced by Fintoc webhook |
| `app/api/webhooks/fintoc/route.ts` | **Create** | Handle `checkout_session.finished` / `payment_intent.succeeded` |
| `types/index.ts` | **Modify** | Rename `mp_preference_id` → `payment_session_id`, `mp_payment_id` → `payment_intent_id`; update `CheckoutResponse` |
| `app/(store)/checkout/page.tsx` | **Modify** | Reemplazar `fetch('/api/checkout')` por llamada directa a Server Action; leer `redirectUrl` en vez de `initPoint` |
| `.env.local` | **Modify** | Remove `MP_*` vars, add `FINTOC_SECRET_KEY`, `FINTOC_WEBHOOK_SECRET` |
| `supabase/migrations/20260531000001_rename_payment_columns.sql.sql` | **Create** | Rename columns in `orders` table |
| `package.json` | **Modify** | `npm uninstall mercadopago && npm install fintoc` |

## Interfaces / Contracts

### `lib/fintoc.ts`

```typescript
import { Fintoc } from 'fintoc'

const fintoc = new Fintoc(process.env.FINTOC_SECRET_KEY!)

export async function createCheckoutSession(input: {
  orderId: string
  amount: number
  customerEmail: string
}) {
  const session = await fintoc.checkoutSessions.create({
    amount: input.amount,
    currency: 'CLP',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/resultado?status=approved`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/resultado?status=rejected`,
    customer_email: input.customerEmail,
    metadata: { order_id: input.orderId },
  })
  return {
    sessionId: session.id,
    redirectUrl: session.redirect_url,
  }
}
```

### Webhook event shape (Fintoc)

```typescript
type FintocEvent = {
  type: 'checkout_session.finished' | 'payment_intent.succeeded' | 'payment_intent.failed'
  data: {
    id: string               // payment_intent id
    object: 'payment_intent'
    amount: number
    status: 'succeeded' | 'failed'
    metadata: { order_id: string }
  }
}
```

### Renamed Order type

```typescript
export type Order = {
  id: string
  status: OrderStatus
  payment_session_id: string | null   // was mp_preference_id
  payment_intent_id: string | null    // was mp_payment_id
  // ... rest unchanged
}
```

### CheckoutAction return (Server Action)

```typescript
export type CheckoutState = {
  success?: boolean
  redirectUrl?: string          // was initPoint
  error?: string
  failedItems?: string[]
}

// La Server Action se usa con useActionState en el formulario:
// const [state, formAction, isPending] = useActionState(checkoutAction, initialState)
// Si success && redirectUrl → window.location.href = redirectUrl
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Checkout action | Mock `@/lib/fintoc` → `{ sessionId, redirectUrl }`; assert `payment_session_id` saved; assert `redirectUrl` returned |
| Unit | Webhook handler | Mock Supabase + Resend; test `checkout_session.finished` → status update; test idempotency; test stock RPC call |
| Unit | Checkout validation | Same 18 existing tests — only mock import path changes, assertion for `redirectUrl` instead of `initPoint` |

Mock strategy: `vi.mock('@/lib/fintoc', () => ({ createCheckoutSession: vi.fn() }))` — same pattern, new path.

## Migration / Rollout

1. Run DB migration (renames columns, existing data preserved)
2. Deploy new code alongside migration
3. Remove `MP_ACCESS_TOKEN` from deployment env vars, add `FINTOC_SECRET_KEY` + `FINTOC_WEBHOOK_SECRET`
4. Verify: checkout creates session → redirects to Fintoc → webhook processes → order approved
5. Old pending MP orders remain readable via `metadata` field (original MP response stored there)

## Open Questions

None.
