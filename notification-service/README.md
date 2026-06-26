# notification-service

Port 8086. Pure RabbitMQ consumer + async email sender — no JPA, no JWT
security, no REST API of its own (besides `/actuator/health`). That's a
deliberate deviation from the usual service skeleton, not an oversight:
this service is never called directly by a user or another service over
HTTP, it's only woken up by a RabbitMQ message, so there's nothing for a
`SecurityConfig`/`JwtFilter` to protect and no `entity`/`repository` to
back (no persistence requirement was in the Day 3 plan either).

## Changes needed in OTHER services (not included in this zip — apply these yourself)

This service assumes `PaymentSuccessEvent.waiterEmail` arrives already
populated. It cannot resolve that itself: it has no HTTP request of its own
to forward a JWT from (unlike order-service→menu-service or
payment-service→order-service, which both forward the *original caller's*
token). A RabbitMQ listener has no caller.

So the email lookup has to happen in **payment-service**, while it still has
a real request context to work with:

1. **auth-service** — add `GET /auth/users/{id}` (or similar) returning at
   least `{ id, email, role }`. Authenticated; any role is probably fine.

2. **payment-service**:
   - Add `AuthServiceClient` (same `FeignConfig` auth-forwarding pattern as
     `OrderServiceClient`/`TableServiceClient`).
   - In `PaymentServiceImpl.verifyPayment()`, after the payment is marked
     `SUCCESS` but before publishing, call `authServiceClient.getUser(order.waiterId)`
     and set `waiterEmail` on the `PaymentSuccessEvent` you build.
   - You'll need the order's `waiterId` — `OrderClientResponse` already
     has it (you're calling `orderServiceClient.getOrder()` already in
     `createPaymentOrder`; either store `waiterId` on the `Payment` entity
     at creation time, or re-fetch the order in `verifyPayment` to get it).

Until that's wired up, this service logs an error and skips sending
(`NotificationServiceImpl.sendReceiptEmail` checks for a null/blank
`waiterEmail` defensively) rather than throwing — there's no HTTP caller
waiting on a response to throw an error back to.

## Setup

1. **RabbitMQ** — `docker-compose up -d` (compose file included here; same
   broker payment-service publishes to). Management UI at
   `http://localhost:15672` (guest/guest) — useful for watching messages
   land on `notification.payment-success.queue` in real time while testing.

2. **SMTP credentials** — set `MAIL_USERNAME` / `MAIL_PASSWORD` /
   `MAIL_HOST` / `MAIL_PORT` env vars. Defaults assume Gmail SMTP:
   - Gmail requires an **App Password**, not your normal login password
     (Google Account → Security → 2-Step Verification → App Passwords).
   - For local testing without sending real email, consider
     [Mailtrap](https://mailtrap.io) instead — sandbox inbox, no real
     delivery, same SMTP config shape (just point `MAIL_HOST`/`MAIL_PORT`/
     credentials at Mailtrap's sandbox SMTP instead of Gmail's).

## How it works

`PaymentEventListener` consumes from `notification.payment-success.queue`
(bound to `pos.events.exchange` with routing key `payment.success` — same
topology payment-service declares, declared again here so this service can
start independently). On receipt, it calls
`NotificationService.sendReceiptEmail()`, which is `@Async` — the listener
returns (and RabbitMQ acks the message) immediately, without waiting on the
SMTP round-trip. Failures are logged, not retried — add a dead-letter queue
+ retry policy if you need guaranteed delivery later.

## Testing without payment-service running

You can test this service in isolation using the RabbitMQ management UI:

1. Go to `http://localhost:15672` → Queues →
   `notification.payment-success.queue` → "Publish message"
2. Paste a JSON payload matching `PaymentSuccessEvent`'s shape, e.g.:
   ```json
   {
     "paymentId": 1,
     "orderId": 10,
     "tableId": 3,
     "waiterId": 2,
     "waiterEmail": "waiter1@pos.com",
     "subtotal": 700.00,
     "taxAmount": 35.00,
     "totalAmount": 735.00,
     "razorpayPaymentId": "pay_test123",
     "paidAt": "2026-06-25T14:30:00"
   }
   ```
3. Check notification-service's logs for `Receipt email sent...` (or the
   error log if SMTP isn't configured yet).
