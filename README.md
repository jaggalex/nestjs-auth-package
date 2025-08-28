# @shared/auth

Context-aware authentication and authorization helpers for NestJS HTTP services.

- Validates JWT via core-service introspection
- Context-aware permission/role checks (organization, workspace, object)
- Simple 30s introspection cache (disabled in development)
- Declarative decorators for auth and access control
- Proper error mapping: 401 / 403 / 503

Files:
- Services: [AuthValidatorService](shared/src/auth/auth-validator.service.ts:15:0-192:1), [TokenExtractorService](shared/src/auth/token-extractor.service.ts:3:0-33:1)
- Guards: [AuthGuard](shared/src/auth/auth.guard.ts:12:0-48:1), [PermissionGuard](shared/src/auth/permission.guard.ts:14:0-90:1), [RoleGuard](shared/src/auth/role.guard.ts:14:0-90:1)
- Decorators: [Auth](shared/src/auth/decorators.ts:5:0-8:64), [RequirePermissions](shared/src/auth/decorators.ts:10:0-21:2), [RequireRoles](shared/src/auth/decorators.ts:23:0-34:2)
- Types: [User](shared/src/auth/types.d.ts:1:0-6:1) and `Express.Request.user` extension

Paths:
- `shared/src/auth/*` re-exported via [shared/src/index.ts](shared/src/index.ts:0:0-0:0)

Package name:
- `@shared/auth` (peerDependencies declared)

## Features

- Auth
  - Extract token from Authorization header or `access_token` cookie
  - Validate token through core-service `/auth/introspect`
  - In-memory 30s cache for introspection (disabled in dev)
- Authorization
  - Validate permissions or roles in a specific context via core-service
  - Multiple permissions/roles with match mode `any | all` (default `all`)
  - Proper error mapping when core-service is down (503)

## Install

In the monorepo, ensure your service has required peer deps:

- @nestjs/common, @nestjs/core, @nestjs/axios
- rxjs, express, axios

Example (per service):
- yarn add -D @nestjs/axios axios
- Ensure Nest 10 and RxJS 7+ are used

## Configuration

Environment variables (consumer services):

- TOKEN_INTROSPECTION_URL
  - Default: http://core-service:3000/auth/introspect
- PERMISSION_CHECK_URL
  - Default: http://core-service:3000/auth/check-permission
- ROLE_CHECK_URL
  - Default: http://core-service:3000/auth/check-role
- NODE_ENV
  - If development, introspection cache is disabled

Context headers (required by guards):

- x-org-id: string (required)
- x-workspace-id: string (optional)
- x-object-id: string (optional)

## Quick start

1) Module setup (consumer service):

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AuthValidatorService, TokenExtractorService } from '@shared/auth';

@Module({
  imports: [
    // Required for AuthValidatorService (HTTP calls to core-service)
    HttpModule,
  ],
  // Make services resolvable for guards
  providers: [AuthValidatorService, TokenExtractorService],
})
export class AppModule {}
```

2) Usage in a controller:

```ts
// example.controller.ts
import { Controller, Get, Post, Param, Headers, UseGuards } from '@nestjs/common';
import { Auth, RequirePermissions, RequireRoles } from '@shared/auth';

@Controller('examples')
export class ExampleController {
  // Only authentication
  @Auth()
  @Get('profile')
  getProfile() {
    return { ok: true };
  }

  // Require permission(s) in context
  @Auth()
  @RequirePermissions(['order.reserve'], 'all') // default is 'all'; specify 'any' when needed
  @Post('orders/:orderId/reserve')
  reserveOrder(@Param('orderId') orderId: string) {
    // Your domain logic here (call order-service, inventory-service)
    return { orderId, status: 'reserve-requested' };
  }

  // Require role(s) in context
  @Auth()
  @RequireRoles(['org.admin'], 'any')
  @Post('admin/do-something')
  doAdminThing() {
    return { done: true };
  }
}
```

3) Client must pass headers:
- x-org-id: required
- Optionally x-workspace-id and x-object-id
- Token: via Authorization: Bearer <token> or cookie access_token

## Guards behavior

- AuthGuard
  - Extracts token from Authorization or cookie
  - Validates via introspection
  - On invalid/expired token → 401 Unauthorized
  - Caches successful introspection for 30 seconds (disabled in dev)
  - Sets `request.user` with fields: `sub`, `role?`, `permissions?`, `accessToken`

- PermissionGuard
  - Reads metadata: `permissions` (string|string[]) and `match` ('all' default | 'any')
  - Extracts context from headers: `x-org-id` (required), `x-workspace-id`, `x-object-id`
  - Calls core-service check-permission with context
  - No permission → 403 Forbidden
  - Core-service/network errors (5xx/unavailable) → 503 Service Unavailable

- RoleGuard
  - Reads metadata: `roles` (string|string[]) and `match` ('all' default | 'any')
  - Context handling and error behavior identical to PermissionGuard

## Decorators API

- Auth()
  - Applies [AuthGuard](shared/src/auth/auth.guard.ts:12:0-48:1)

- RequirePermissions(permissions: string[] | string, match: 'any' | 'all' = 'all')
  - Sets metadata and applies [PermissionGuard](shared/src/auth/permission.guard.ts:14:0-90:1)

- RequireRoles(roles: string[] | string, match: 'any' | 'all' = 'all')
  - Sets metadata and applies [RoleGuard](shared/src/auth/role.guard.ts:14:0-90:1)

Examples:

```ts
@Auth()
@RequirePermissions(['product.create', 'product.publish'], 'all')

@Auth()
@RequireRoles('org.manager') // single role; equivalent to ['org.manager']
```

## BFF example: reserve order

1) Client calls BFF:
- POST /orders/:orderId/reserve
- Headers:
  - Authorization: Bearer <token> (or cookie `access_token`)
  - x-org-id: org-123
  - x-workspace-id: ws-789 (optional)
  - x-object-id: order-456 (optional: can be derived from route param)
- Body: { …domain payload… }

2) BFF controller:

```ts
@Auth()
@RequirePermissions(['order.reserve'], 'all')
@Post('/orders/:orderId/reserve')
async reserve(@Param('orderId') orderId: string) {
  // 1) verify order state (order-service)
  // 2) fetch product spec (catalog-service)
  // 3) request stock reservation in inventory-service
  return { orderId, reserved: true };
}
```

3) Guards interaction:
- AuthGuard validates token and sets `request.user`
- PermissionGuard extracts headers (org/workspace/object), checks permission via core-service
- On success, controller logic runs

## Error mapping

- 401 Unauthorized
  - No token, invalid token, or inactive token
- 403 Forbidden
  - User authenticated but lacks required permissions/roles
- 503 Service Unavailable
  - Core-service unavailable or network/5xx during permission/role check

## Caching

- Introspection cache: 30 seconds (in-memory; per-process)
- Disabled when `NODE_ENV=development`
- No authorization (permission/role) result cache yet; consider per-request memoization if needed

## Types

- User (from `@shared/auth`):
  - sub: string
  - role?: string
  - permissions?: string[]
  - accessToken: string
- Request enrichment:
  - `Express.Request.user?: User`

## Migration notes

- Legacy decorators removed:
  - Use only [Auth](shared/src/auth/decorators.ts:5:0-8:64), [RequirePermissions](shared/src/auth/decorators.ts:10:0-21:2), [RequireRoles](shared/src/auth/decorators.ts:23:0-34:2)
- Legacy metadata keys removed:
  - Use `permissions`/`roles` and `match` only

## Troubleshooting

- 401 but token is present
  - Check TOKEN_INTROSPECTION_URL
  - Ensure token actually active in core-service

- 503 during checks
  - Core-service down or networking issue
  - Verify PERMISSION_CHECK_URL / ROLE_CHECK_URL and service availability

- 403 despite expected permissions
  - Verify `x-org-id` is set
  - Verify `permissions`/`roles` and `match` mode on handler
  - Check core-service responses and context objects

## Security notes

- Ensure tokens are not logged
- For browser clients, consider HttpOnly/Secure/SameSite for cookie delivery
- Prefer Authorization header in production where possible
