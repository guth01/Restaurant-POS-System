# api-gateway

Port 8080. Pure router — no JWT validation happens here. Each downstream
service still does its own auth/RBAC via its own `JwtFilter` + `SecurityConfig`,
per the Day 2 decision (per-service validation is simpler to debug on a
4-day timeline; gateway-level auth was deliberately not added).

## Routes

| Path prefix     | Forwards to    | Port |
|------------------|----------------|------|
| `/auth/**`       | auth-service   | 8081 |
| `/menu-items/**` | menu-service   | 8082 |
| `/tables/**`     | table-service  | 8083 |
| `/orders/**`     | order-service  | 8084 |

Note the menu-service route is `/menu-items/**`, not `/menu/**` — the
original plan doc said `/menu/**`, but the actual controller mapping
(confirmed during order-service Feign testing) is `/menu-items`. If you
ever add a real `/menu/**`-style path later, add a second route rather than
renaming this one, since order-service's Feign client also depends on
`/menu-items/{id}`.

## Running locally

```bash
mvn clean install
mvn spring-boot:run
```

This is a **reactive** Spring Boot app (Spring Cloud Gateway runs on
WebFlux/Netty, not Tomcat). Don't add `spring-boot-starter-web` to this
project — mixing servlet and reactive stacks on the same app will cause
startup failures.

Gateway starts fine even if downstream services are down; routes are
resolved per-request, not validated at boot. You'll only see errors when
you actually hit a route whose target service isn't running (502/504).

## Testing

Re-run every Postman request from auth/menu/table/order-service, but swap
the base URL from the individual service port to `localhost:8080`, keeping
the same path. Headers (especially `Authorization`) pass through unchanged —
the gateway doesn't touch them.

Example: instead of
`POST http://localhost:8084/orders` →
`POST http://localhost:8080/orders`

Expected: identical responses, status codes, and RBAC behavior as hitting
the service directly. If gateway requests behave differently than direct
ones, suspect a route predicate path mismatch first.
