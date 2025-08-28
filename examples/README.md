# Examples

This directory contains practical examples of how to use `@yagas-cat/nestjs-auth` in different scenarios.

## Available Examples

### 1. Basic App (`basic-app.ts`)
Demonstrates fundamental usage with NestJS controllers and decorators.

**Features:**
- Public endpoints (no auth required)
- JWT token validation
- Role-based access control
- Permission-based access control
- User context injection

**Usage:**
```typescript
import { Auth, RequirePermissions, RequireRoles } from '@yagas-cat/nestjs-auth';

@Controller('api')
export class ApiController {
  @Get('public')
  publicEndpoint() {
    return 'No auth required';
  }

  @Get('authenticated')
  @Auth()
  authenticatedEndpoint() {
    return 'JWT required';
  }

  @Get('admin-only')
  @RequireRoles('admin')
  adminEndpoint() {
    return 'Admin role required';
  }
}
```

### 2. Middleware Example (`middleware-example.ts`)
Shows how to use the auth package with Express middleware instead of decorators.

**Features:**
- Authentication middleware
- Permission middleware factory
- Role middleware factory
- Custom error handling

**Usage:**
```typescript
// Apply to all routes
consumer.apply(AuthMiddleware).forRoutes('*');

// Apply to specific routes with permissions
consumer
  .apply(createPermissionMiddleware(['admin']))
  .forRoutes({ path: 'admin/*', method: RequestMethod.ALL });
```

### 3. Microservice Integration (`microservice-integration.ts`)
Demonstrates integration in a microservice architecture.

**Features:**
- Global auth module
- Service-specific configuration
- Custom token extractors
- Batch permission checking
- Docker Compose setup example

**Usage:**
```typescript
@Global()
@Module({
  imports: [HttpModule],
  providers: [AuthValidatorService, TokenExtractorService],
  exports: [AuthValidatorService, TokenExtractorService],
})
export class GlobalAuthModule { }
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install @yagas-cat/nestjs-auth @nestjs/common @nestjs/core @nestjs/axios @nestjs/platform-express reflect-metadata rxjs
   ```

2. **Set environment variables:**
   ```bash
   TOKEN_INTROSPECTION_URL=http://your-core-service:3000/auth/introspect
   PERMISSION_CHECK_URL=http://your-core-service:3000/auth/check-permission
   ROLE_CHECK_URL=http://your-core-service:3000/auth/check-role
   ```

3. **Import and use:**
   ```typescript
   import { Auth, RequirePermissions } from '@yagas-cat/nestjs-auth';

   @Controller('protected')
   export class ProtectedController {
     @Get()
     @RequirePermissions(['read:data'])
     getData() {
       return 'Protected data';
     }
   }
   ```

## Common Patterns

### 1. Global Setup
```typescript
@Module({
  imports: [HttpModule],
  providers: [AuthValidatorService, TokenExtractorService],
  exports: [AuthValidatorService, TokenExtractorService],
})
export class AuthModule { }
```

### 2. Route-Specific Guards
```typescript
@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  @Get('public')
  @UseGuards() // Override to make public
  publicEndpoint() {}

  @Get('protected')
  protectedEndpoint() {} // Uses AuthGuard from class level
}
```

### 3. Context-Aware Permissions
```typescript
@Get('workspace/:id/items')
@RequirePermissions(['workspace.item.read'])
getWorkspaceItems(@Param('id') workspaceId: string) {
  // Permission check includes workspace context automatically
}
```

## Error Handling

The package throws standard HTTP exceptions:

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions/roles
- `400 Bad Request` - Missing required headers
- `503 Service Unavailable` - Auth service unavailable

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TOKEN_INTROSPECTION_URL` | Token validation endpoint | `http://core-service:3000/auth/introspect` |
| `PERMISSION_CHECK_URL` | Permission checking endpoint | `http://core-service:3000/auth/check-permission` |
| `ROLE_CHECK_URL` | Role checking endpoint | `http://core-service:3000/auth/check-role` |
| `NODE_ENV` | Environment mode | `development` |

## Headers

Required headers for protected endpoints:

- `Authorization: Bearer <token>` or `Cookie: access_token=<token>`
- `x-org-id: <organization-id>` (for permission/role checks)
- `x-workspace-id: <workspace-id>` (optional)
- `x-object-id: <object-id>` (optional)

## Running Examples

Each example can be run independently:

```bash
# Install dependencies
npm install

# Set environment variables
export TOKEN_INTROSPECTION_URL=http://localhost:3000/auth/introspect
export PERMISSION_CHECK_URL=http://localhost:3000/auth/check-permission
export ROLE_CHECK_URL=http://localhost:3000/auth/check-role

# Run tests
npm test
```

## Contributing

Add new examples by creating new `.ts` files in this directory with clear documentation and usage examples.