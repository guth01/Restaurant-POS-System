# order-service

Port 8084, db `pos_order`. Follows the same package skeleton, Lombok conventions,
JWT structure, RBAC double-enforcement, and exception-handling shape as
auth-service / menu-service / table-service.

## Things to verify against your real codebase

I built this from the project's design-conventions doc, not from the actual
auth/menu/table source files. Everything below should match, but double-check
these specific points since they're guesses based on the doc rather than
confirmed code:

1. **`menu-service`'s read endpoint path.** I assumed `GET /menu-items/{id}`
   based on the Day 1 summary ("Full CRUD at /menu-items"). If the actual
   controller mapping differs, fix `MenuServiceClient.getMenuItem()` in
   `client/MenuServiceClient.java`.

2. **`MenuItemResponse` shape.** I mirrored the fields listed in the Day 1
   summary (`name`, `description`, `price`, `category`, `taxRate`,
   `isAvailable`, `prepTimeMinutes`). If menu-service's actual response DTO
   has different field names, Feign's JSON deserialization will silently
   leave mismatched fields null — update `client/MenuItemResponse.java` to match.

3. **Auth forwarding to menu-service.** Day 1 says menu-service requires auth
   on every read. order-service's Feign calls won't carry the original
   `Authorization` header unless explicitly forwarded, so I added
   `client/FeignClientConfig.java` with a `RequestInterceptor` that copies the
   incoming request's `Authorization` header onto the outgoing Feign call.
   This is new — it wasn't in any other service per the doc — so sanity check
   it works once both services are running together.

4. **JWT claim types.** Doc specifies `userId` and `role` as custom claims
   with `email` as subject. I extract `userId` as `Long` via
   `claims.get("userId", Long.class)` — if auth-service actually puts it in
   as `Integer`, this extraction could throw. Test this first thing.

5. **`ItemStatus` transitions are unenforced** (any status can follow any
   other), unlike table-service's strict state machine. This was a deliberate
   simplification per the original plan doc, not an oversight — revisit if
   kitchen-display needs stricter guarantees.

## Endpoints

| Method | Path                          | Roles                  |
|--------|-------------------------------|-------------------------|
| POST   | `/orders`                     | WAITER, ADMIN           |
| GET    | `/orders/{id}`                | WAITER, ADMIN, KITCHEN  |
| GET    | `/orders/table/{tableId}`     | WAITER, ADMIN, KITCHEN  |
| POST   | `/orders/{id}/items`          | WAITER, ADMIN           |
| PUT    | `/orders/items/{itemId}/status` | KITCHEN, ADMIN        |

`POST /orders/{id}/items` calls menu-service live via Feign to verify the
menu item exists and is available, and snapshots `name`/`price` onto the
`OrderItem` at that moment — those snapshots never get re-fetched later even
if the menu item's price changes afterward (intentional, per the
`priceAtOrderTime` design).

## Running locally

```bash
mvn clean install
mvn spring-boot:run
```

Needs MySQL reachable at `localhost:3306` (or override via `DB_USER` /
`DB_PASSWORD` / `DB_NAME` env vars) and menu-service running at
`localhost:8082` (or override via `MENU_SERVICE_URL`) for the Feign step to
work. The basic CRUD (create order, get order, update item status) works
fine even with menu-service down — only `POST /orders/{id}/items` needs it.

## Testing order (matches the Day 2 plan)

1. Get order CRUD working in isolation first — create order, get order,
   update item status — **without** worrying about Feign yet. Add an item
   directly; it'll fail because `addItem` always calls menu-service. If you
   want to test pure CRUD before menu-service is up, temporarily stub
   `verifyMenuItem()` in `OrderServiceImpl` to skip the Feign call.
2. Once that's solid, bring up menu-service and re-test `addItem` for real,
   including a deliberately-unavailable or nonexistent `menuItemId` to check
   the 400 paths.
3. Then route everything through the API Gateway and re-run the same
   Postman collection against `localhost:8080` instead of `localhost:8084`.
