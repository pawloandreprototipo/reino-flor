# Tasks: Real Payments Integration

## Task 1: Fix Stripe Mock Detection Logic
- [x] 1.1 Update `getStripe()` in `apps/api/lib/payments/stripe.ts` to check `key.includes('MOCK')` instead of `key === 'sk_test_MOCK'`, so restricted keys (`rk_test_...`) and standard keys (`sk_test_...`) both create a real Stripe instance
- [x] 1.2 Ensure the singleton cache (`_stripe`) is only set for real keys, and the mock path never caches to `_stripe`
- [x] 1.3 Update `.env.example` to document that `STRIPE_SECRET_KEY` accepts `rk_test_...` restricted keys

## Task 2: Install Stripe Frontend Dependencies
- [x] 2.1 Install `@stripe/stripe-js` and `@stripe/react-stripe-js` in `apps/storefront`

## Task 3: Create Stripe.js Client Utility
- [ ] 3.1 Create `apps/storefront/lib/stripe.ts` that exports a `getStripePromise()` function using `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` with lazy singleton caching

## Task 4: Create StripePaymentForm Component
- [ ] 4.1 Create `apps/storefront/components/ui/StripePaymentForm.tsx` that accepts `clientSecret`, `orderId`, and `amount` props
- [ ] 4.2 Wrap the form in Stripe `Elements` provider with the `clientSecret` as option
- [ ] 4.3 Render a `CardElement` with TailwindCSS-compatible styling
- [ ] 4.4 Implement form submit handler that calls `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })`
- [ ] 4.5 Handle success (redirect to `/pedido/{orderId}`), error (display message), and loading (disable button) states

## Task 5: Create Payment Page Route
- [ ] 5.1 Create `apps/storefront/app/pagamento/[orderId]/page.tsx` that extracts `orderId` from URL params
- [ ] 5.2 On mount, call `POST /api/payments/create` with `{ orderId, method: 'CREDIT_CARD' }` to get `clientSecret` and `amount`
- [ ] 5.3 Render `StripePaymentForm` with the received `clientSecret`, `orderId`, and `amount`
- [ ] 5.4 Handle loading state (skeleton/spinner) and error state (error message with retry option)

## Task 6: Update Checkout Flow Routing
- [ ] 6.1 In `apps/storefront/app/checkout/page.tsx`, update the `onSubmit` handler to redirect to `/pagamento/{orderId}` when `paymentMethod` is `'CREDIT_CARD'` or `'DEBIT_CARD'`
- [ ] 6.2 Keep existing redirect to `/pedido/{orderId}` for PIX and BOLETO methods

## Task 7: Enhance PaymentStatus with QR Code and Countdown
- [ ] 7.1 Update `apps/storefront/components/ui/PaymentStatus.tsx` to render the `pixQrCode` as a base64 `<img>` element when available
- [ ] 7.2 Add a countdown timer component that computes remaining time from `pixExpiration` and displays in `MM:SS` format
- [ ] 7.3 When countdown reaches zero, display "PIX expirado" message and stop the status polling
- [ ] 7.4 Ensure polling stops when payment status changes from `PENDING` to any other status

## Task 8: Update Payment Status API to Return pixQrCode
- [ ] 8.1 In `apps/api/pages/api/payments/status.ts`, add `pixQrCode` to the Prisma `select` clause so the field is returned in the API response

## Task 9: Update Order Page for PIX Payment Creation
- [ ] 9.1 In `apps/storefront/app/pedido/[id]/page.tsx`, when the order has `payment.method === 'PIX'` and `payment.status === 'PENDING'` and no `pixCode` yet, trigger `POST /api/payments/create` with `{ orderId, method: 'PIX' }` to initialize the PIX payment
- [ ] 9.2 Pass the returned `pixQrCode` data to the `PaymentStatus` component or let it fetch via the status API

## Task 10: Verify Webhook Configuration
- [ ] 10.1 Verify that `apps/api/pages/api/webhooks/stripe.ts` correctly uses `getStripe()` (which now returns real client) for `constructEvent` signature verification
- [ ] 10.2 Verify that `apps/api/pages/api/webhooks/mercadopago.ts` correctly fetches real payment status from MP API when `MP_ACCESS_TOKEN` is not "TEST-MOCK"
- [ ] 10.3 Update `.env.example` with documentation comments for `STRIPE_WEBHOOK_SECRET` (from Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`)
