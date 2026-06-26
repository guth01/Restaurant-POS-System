# Restaurant POS — Angular Frontend

Angular 17 (standalone components, signals) frontend for the Spring Boot microservices POS backend.

## Quick Start

```bash
npm install
npm start            # dev server on http://localhost:4200
```

## Architecture

```
src/app/
  core/
    auth/            AuthService (JWT, in-memory), RoleGuard
    websocket/       WebSocketService (STOMP over SockJS)
    interceptors/    authInterceptor (attaches Bearer token)
    services/        MenuService, TableService, OrderService, PaymentService, ToastService
  shared/
    models/          All TypeScript interfaces mirroring backend DTOs
    components/      NavbarComponent, ToastComponent
  features/
    auth/            Login, Register
    waiter-terminal/ TableGrid, OrderScreen (menu + order + Razorpay)
    kitchen-display/ KitchenDisplay (WebSocket live feed + status buttons)
    admin-dashboard/ AdminShell, MenuManagement, TableManagement
```

## Environment config

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  gatewayUrl: 'http://localhost:8080',      // Spring Cloud Gateway
  paymentServiceUrl: 'http://localhost:8085', // Direct (see Gap #1)
  wsUrl: 'http://localhost:8084/ws',          // order-service WebSocket
};
```

## Key notes from the handoff doc

### Gap #1 — Gateway missing `/payments/**` route
Payment calls go directly to port 8085. Fix: add the route to `api-gateway/application.yml`:
```yaml
- id: payment-service
  uri: http://localhost:8085
  predicates:
    - Path=/payments/**
```
Then change `paymentServiceUrl` in environment to `http://localhost:8080`.

### Gap #2 — Table must be BILLED before payment
The order screen enforces this: "Request Bill" button calls `PUT /tables/{id}/bill` first,
then the "Pay with Razorpay" button appears. Don't reorder these.

### Gap #3 — WebSocket has no auth
`/ws` is `permitAll` on the backend. OK for dev, flag for production hardening.

### Gap #4 — No admin order/payment history
`order-service` has no `GET /orders` (all). The Admin Dashboard doesn't show order history —
that requires new backend endpoints.

## Role routing

| Role    | Landing page         |
|---------|---------------------|
| WAITER  | `/waiter`           |
| KITCHEN | `/kitchen`          |
| ADMIN   | `/admin`            |

All routes are guarded with `RoleGuard`. The JWT is decoded client-side (jwt-decode) for UX only;
role enforcement is on the backend.

## Razorpay integration

The Razorpay checkout.js script is loaded in `index.html`. The flow in `order-screen.component.ts`:
1. `POST /payments/create-order` → get `razorpayOrderId`, `razorpayKeyId`, `amountInPaise`
2. Open `new Razorpay(options).open()`
3. On success callback → `POST /payments/verify` with the three Razorpay response fields
4. Refresh table + order state

## WebSocket

The `WebSocketService` is a singleton that opens one STOMP connection to `ws://localhost:8084/ws`.
- Kitchen subscribes to `/topic/kitchen` (all item events)
- Waiter table grid subscribes to `/topic/waiter` (only READY events)

Both auto-reconnect every 5 seconds if disconnected.
