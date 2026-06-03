# Payments Specification

## Purpose

The payments domain manages checkout session creation and webhook processing using **Fintoc**, a Chilean payment gateway supporting all Chilean banks and prepaid cards. This replaces the previous Mercado Pago integration entirely.

## Requirements

### R1: Checkout Session Creation

The checkout server action MUST create a Fintoc checkout session after all validations pass and before the order is committed.

#### Scenario: Successful checkout

- GIVEN the customer submits valid form data with sufficient stock for all items
- WHEN `checkout()` validates stock and creates the order
- THEN `fintoc.checkoutSessions.create()` is called with `amount` (CLP integer), `currency: "CLP"`, `success_url`, `cancel_url`, `customer_email`, and `order_id` in `metadata`
- AND the order is saved with the returned session ID in `payment_session_id`
- AND the action returns `{ success: true, redirectUrl }`

#### Scenario: Fintoc API failure

- GIVEN `fintoc.checkoutSessions.create()` throws or returns an error
- WHEN checkout() attempts to create the session
- THEN the action catches the error and returns `{ error: "Error interno del servidor" }`
- AND the order remains in `pending` without a `payment_session_id`

#### Scenario: Fintoc response missing redirect_url

- GIVEN `fintoc.checkoutSessions.create()` returns a session without a `redirect_url`
- WHEN checkout() processes the response
- THEN the action returns `{ error: "Error interno del servidor" }`
- AND no order update is performed

### R2: Stock Validation

The checkout action MUST reject orders with insufficient stock BEFORE any Fintoc API call.

#### Scenario: Insufficient stock

- GIVEN a variant has stock of 2 but the customer requests 5
- WHEN checkout() validates stock
- THEN it returns `{ error: "STOCK_INSUFFICIENT", failedItems: [variantId] }`
- AND `fintoc.checkoutSessions.create()` is NOT called

#### Scenario: Variant not found

- GIVEN a requested variant ID does not exist in the database
- WHEN checkout() queries product_variants
- THEN the variant is included in `failedItems`
- AND `fintoc.checkoutSessions.create()` is NOT called

### R3: Webhook Event Processing

The webhook route MUST handle Fintoc events and update the corresponding order.

#### Scenario: Payment finished (approved)

- GIVEN Fintoc sends a `checkout_session.finished` event with `metadata.order_id` and `data.id`
- WHEN `POST /api/webhooks/fintoc` processes the event
- THEN the order status is set to `approved`
- AND `payment_intent_id` is saved on the order
- AND stock is decremented per item via `decrement_stock` RPC
- AND a confirmation email is sent to the customer
- AND the handler returns 200 OK

#### Scenario: Payment failed

- GIVEN Fintoc sends a `payment_intent.failed` event with `metadata.order_id`
- WHEN the webhook processes the event
- THEN the order status is set to `rejected`
- AND `payment_intent_id` is saved on the order
- AND no stock is decremented

### R4: Webhook Idempotency

The webhook handler MUST reject duplicate events to prevent double-processing.

#### Scenario: Duplicate event discarded

- GIVEN a `checkout_session.finished` event was already processed for an order (order already has `payment_intent_id` set)
- WHEN an identical event arrives
- THEN the handler returns 200 OK without modifying the order
- AND stock is NOT decremented again
- AND no email is sent

#### Scenario: Unknown order_id

- GIVEN a webhook event references a non-existent `metadata.order_id`
- WHEN the handler processes the event
- THEN it returns 200 OK and logs a warning
- AND no database mutation occurs

#### Scenario: Malformed payload

- GIVEN a webhook payload is missing `metadata.order_id` or `data.id`
- WHEN the handler processes the event
- THEN it returns 200 OK without further processing

### R5: Database Schema Migration

The orders table MUST use provider-agnostic column names for future compatibility.

#### Scenario: Column rename

- GIVEN the database migration runs
- WHEN `mp_preference_id` is renamed to `payment_session_id`
- AND `mp_payment_id` is renamed to `payment_intent_id`
- THEN existing data in those columns is preserved
- AND old column names are removed from the schema

### R6: Code Removal

All Mercado Pago code, dependencies, and configuration MUST be removed.

| Artifact | Action |
|----------|--------|
| `lib/mercadopago.ts` | **Delete** — entire file |
| `app/api/webhooks/mercadopago/route.ts` | **Delete** — entire file |
| `mercadopago` npm package | **Remove** from package.json |
| `MP_ACCESS_TOKEN` in `.env.local` | **Remove** from env |
| `NEXT_PUBLIC_MP_PUBLISHABLE_KEY` in `.env.local` | **Remove** from env |
| `FINTOC_SECRET_KEY` in `.env.local` | **Add** to env |
| `FINTOC_WEBHOOK_SECRET` in `.env.local` | **Add** to env |

### R7: Fintoc SDK Wrapper

The system MUST provide a thin wrapper around the Fintoc SDK in `lib/fintoc.ts`.

#### Scenario: Module initialization

- GIVEN `FINTOC_SECRET_KEY` is set in environment variables
- WHEN `lib/fintoc.ts` is imported server-side
- THEN a Fintoc client is initialized with the secret key at module level
- AND `createCheckoutSession()` is available as the exported function

#### Scenario: Missing secret key

- GIVEN `FINTOC_SECRET_KEY` is NOT set
- WHEN `lib/fintoc.ts` is imported
- THEN the module SHOULD throw a clear error during initialization

### R8: Types

The TypeScript types MUST be updated to reflect the provider-agnostic naming.

| Field | Old Name | New Name |
|-------|----------|----------|
| Order | `mp_preference_id` | `payment_session_id` |
| Order | `mp_payment_id` | `payment_intent_id` |
| CheckoutState | `initPoint` | `redirectUrl` |
| CheckoutResponse | `{ preferenceId, initPoint }` | `{ redirectUrl }` |
