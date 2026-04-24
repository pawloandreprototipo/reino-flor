# Requirements: Real Payments Integration

## Requirement 1: Stripe Mock Detection Fix

### User Story
As a developer, I want the Stripe client initialization to correctly distinguish between mock and real API keys (including restricted keys like `rk_test_...`), so that real sandbox keys activate the real Stripe SDK instead of the mock.

### Acceptance Criteria
- 1.1 Given `STRIPE_SECRET_KEY` is undefined or empty, when `getStripe()` is called, then it returns the mock Stripe client.
- 1.2 Given `STRIPE_SECRET_KEY` contains the substring "MOCK" (e.g., `"sk_test_MOCK"`), when `getStripe()` is called, then it returns the mock Stripe client.
- 1.3 Given `STRIPE_SECRET_KEY` is a valid restricted key (`rk_test_...`) that does not contain "MOCK", when `getStripe()` is called, then it returns a real Stripe instance initialized with that key.
- 1.4 Given `STRIPE_SECRET_KEY` is a standard secret key (`sk_test_...`) that does not contain "MOCK", when `getStripe()` is called, then it returns a real Stripe instance.
- 1.5 Given `getStripe()` has been called once with a real key, when called again, then it returns the same cached Stripe instance (singleton pattern).

## Requirement 2: Stripe Elements Frontend Integration

### User Story
As a customer, I want to enter my credit card details in a secure Stripe-powered form on the storefront, so that I can pay for my order with a credit card.

### Acceptance Criteria
- 2.1 Given `@stripe/stripe-js` and `@stripe/react-stripe-js` are installed in the storefront, when the payment page loads, then Stripe.js is initialized with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- 2.2 Given a valid `clientSecret` from the API, when the `StripePaymentForm` component renders, then it displays a Stripe `CardElement` inside an `Elements` provider.
- 2.3 Given the user has entered valid card details and clicks the pay button, when `stripe.confirmCardPayment()` succeeds, then the user is redirected to `/pedido/{orderId}`.
- 2.4 Given the user enters an invalid or declined card, when `stripe.confirmCardPayment()` returns an error, then the error message is displayed in the form and the user can retry.
- 2.5 Given the pay button is clicked, when payment is processing, then the button shows a loading state and is disabled to prevent double submission.

## Requirement 3: Card Payment Page Route

### User Story
As a customer who selected credit card payment at checkout, I want to be redirected to a dedicated payment page that loads the Stripe card form, so that I can complete my card payment.

### Acceptance Criteria
- 3.1 Given the user completes checkout with `paymentMethod: 'CREDIT_CARD'`, when the order is created, then the user is redirected to `/pagamento/{orderId}` instead of `/pedido/{orderId}`.
- 3.2 Given the payment page loads with a valid `orderId`, when the page mounts, then it calls `POST /api/payments/create` with `{ orderId, method: 'CREDIT_CARD' }` and receives a `clientSecret`.
- 3.3 Given the `clientSecret` is received, when the `StripePaymentForm` renders, then it displays the card input form alongside the order amount.
- 3.4 Given the payment page loads with an invalid `orderId` or the API returns an error, when the page mounts, then an error message is displayed to the user.

## Requirement 4: Enhanced PIX Payment Flow

### User Story
As a customer who selected PIX payment, I want to see a scannable QR code and a countdown timer showing how long I have to pay, so that I can complete my PIX payment easily.

### Acceptance Criteria
- 4.1 Given a PIX payment is created and the API returns `pixQrCode` (base64 PNG), when the `PaymentStatus` component renders, then it displays the QR code as an image.
- 4.2 Given a PIX payment has a `pixExpiration` timestamp, when the `PaymentStatus` component renders, then it shows a countdown timer in `MM:SS` format.
- 4.3 Given the PIX countdown reaches zero, when the timer expires, then the UI displays "PIX expirado" and stops polling for payment status.
- 4.4 Given the payment status API is polled and returns `status: 'PAID'`, when the `PaymentStatus` component updates, then it shows "Pagamento confirmado" and stops polling.
- 4.5 Given the `PaymentStatus` component is polling, when the payment status is `'PENDING'`, then it polls every 5 seconds.

## Requirement 5: Payment Status API Enhancement

### User Story
As a frontend developer, I need the payment status API to return the `pixQrCode` field, so that the storefront can render the QR code image for PIX payments.

### Acceptance Criteria
- 5.1 Given a PIX payment exists with a `pixQrCode` value stored (from the initial payment creation), when `GET /api/payments/status?orderId=xxx` is called, then the response includes the `pixQrCode` field.
- 5.2 Given a non-PIX payment, when the status API is called, then `pixQrCode` is null in the response.

## Requirement 6: Checkout Flow Routing

### User Story
As a customer, I want the checkout to route me to the correct page based on my payment method, so that I see the appropriate payment interface.

### Acceptance Criteria
- 6.1 Given the user selects `CREDIT_CARD` or `DEBIT_CARD` at checkout, when the order is created successfully, then the user is redirected to `/pagamento/{orderId}`.
- 6.2 Given the user selects `PIX` at checkout, when the order is created successfully, then the user is redirected to `/pedido/{orderId}` where the PIX flow is handled inline.
- 6.3 Given the user selects `BOLETO` at checkout, when the order is created successfully, then the user is redirected to `/pedido/{orderId}`.

## Requirement 7: Webhook Payment Confirmation

### User Story
As the system, I need Stripe and Mercado Pago webhooks to correctly update payment and order status when payments are confirmed, so that the order fulfillment process can proceed.

### Acceptance Criteria
- 7.1 Given a `payment_intent.succeeded` Stripe webhook event, when the webhook handler processes it, then the corresponding Payment record is updated to `PAID` with `paidAt` set, and the Order status is updated to `CONFIRMED`.
- 7.2 Given a `payment_intent.payment_failed` Stripe webhook event, when the webhook handler processes it, then the Payment record is updated to `FAILED`.
- 7.3 Given a Mercado Pago webhook with `type: 'payment'` and the payment status is `approved`, when the handler fetches and verifies the payment from MP API, then the Payment is updated to `PAID` and Order to `CONFIRMED`.
- 7.4 Given a webhook request with an invalid Stripe signature, when the handler attempts to verify it, then it returns HTTP 400 and does not modify any database records.
