# @yagas-cat/nestjs-auth

[![npm version](https://badge.fury.io/js/%40your-org%2Fnestjs-auth.svg)](https://badge.fury.io/js/%40your-org%2Fnestjs-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive NestJS authentication and authorization package providing JWT validation, role-based access control (RBAC), and permission-based access control with seamless integration with external auth services.

## Features

- 🚀 **JWT Token Validation** - Validate JWT tokens via introspection endpoint
- 🔐 **Role-Based Access Control** - Check user roles with flexible matching (any/all)
- 🛡️ **Permission-Based Access Control** - Verify user permissions with context support
- 🎯 **Declarative Guards** - Use decorators for clean, declarative authorization
- 📦 **Standalone Package** - No external dependencies, fully self-contained
- 🧪 **Comprehensive Testing** - Full test coverage with Jest
- 📚 **TypeScript Support** - Full TypeScript definitions included

## Installation

```bash
npm install @yagas-cat/nestjs-auth
```

Or with yarn:

```bash
yarn add @yagas-cat/nestjs-auth
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthValidatorService, TokenExtractorService, AuthGuard, PermissionGuard, RoleGuard } from '@yagas-cat/nestjs-auth';

@Module({
  imports: [HttpModule],
  providers: [AuthValidatorService, TokenExtractorService, AuthGuard, PermissionGuard, RoleGuard],
  exports: [AuthValidatorService, TokenExtractorService, AuthGuard, PermissionGuard, RoleGuard],
})
export class AuthModule {}
```

### 2. Configure Environment Variables

```bash
# Auth service URLs
TOKEN_INTROSPECTION_URL=http://your-core-service:3000/auth/introspect
PERMISSION_CHECK_URL=http://your-core-service:3000/auth/check-permission
ROLE_CHECK_URL=http://your-core-service:3000/auth/check-role

# Development mode (disables token caching)
NODE_ENV=production
```

### 3. Use Guards in Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Auth, RequirePermissions, RequireRoles } from '@yagas-cat/nestjs-auth';

@Controller('api')
export class ApiController {

  @Get('public')
  publicEndpoint() {
    return 'No auth required';
  }

  @Get('authenticated')
  @UseGuards(AuthGuard)
  authenticatedEndpoint() {
    return 'JWT required';
  }

  @Get('admin-only')
  @RequireRoles('admin')
  adminEndpoint() {
    return 'Admin role required';
  }

  @Get('user-management')
  @RequirePermissions(['user.create', 'user.update'], 'any')
  userManagementEndpoint() {
    return 'User management permissions required';
  }
}
```

## API Documentation

### Decorators

#### `Auth()`
Applies basic authentication guard to ensure valid JWT token.

```typescript
@Auth()
@Get('protected')
protectedEndpoint() {
  // Requires valid JWT token
}
```

#### `RequirePermissions(permissions, match?)`
Requires specific permissions with optional matching mode.

```typescript
// All permissions required (default)
@RequirePermissions(['user.read', 'user.write'])
strictPermissionsEndpoint() { }

// Any permission required
@RequirePermissions(['admin', 'moderator'], 'any')
flexiblePermissionsEndpoint() { }
```

#### `RequireRoles(roles, match?)`
Requires specific roles with optional matching mode.

```typescript
// All roles required (default)
@RequireRoles(['admin', 'manager'])
strictRolesEndpoint() { }

// Any role required
@RequireRoles(['user', 'guest'], 'any')
flexibleRolesEndpoint() { }
```

### Guards

#### `AuthGuard`
Validates JWT tokens and extracts user information.

**Headers Required:**
- `Authorization: Bearer <token>` or
- Cookie: `access_token=<token>`

#### `PermissionGuard`
Checks user permissions with context support.

**Headers Required:**
- `Authorization: Bearer <token>`
- `x-org-id: <organization-id>` (required)
- `x-workspace-id: <workspace-id>` (optional)
- `x-object-id: <object-id>` (optional)

#### `RoleGuard`
Checks user roles with context support.

**Headers Required:**
- `Authorization: Bearer <token>`
- `x-org-id: <organization-id>` (required)
- `x-workspace-id: <workspace-id>` (optional)
- `x-object-id: <object-id>` (optional)

### Services

#### `AuthValidatorService`

```typescript
@Injectable()
export class AuthValidatorService {
  async validateToken(token: string): Promise<User>
  async checkPermission(user: User, permissions: string[], match: 'any' | 'all', context: Context): Promise<boolean>
  async checkRole(user: User, roles: string[], match: 'any' | 'all', context: Context): Promise<boolean>
}
```

#### `TokenExtractorService`

```typescript
@Injectable()
export class TokenExtractorService {
  extractToken(request: Request): string | undefined
}
```

### Types

#### `User`
```typescript
interface User {
  sub: string;           // User ID
  role?: string;         // User role
  permissions?: string[]; // User permissions
  accessToken: string;   // JWT token
}
```

#### `Context`
```typescript
interface Context {
  orgId: string;
  workspaceId?: string;
  objectId?: string;
  objectType?: string;
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TOKEN_INTROSPECTION_URL` | URL for token validation | `http://core-service:3000/auth/introspect` |
| `PERMISSION_CHECK_URL` | URL for permission checking | `http://core-service:3000/auth/check-permission` |
| `ROLE_CHECK_URL` | URL for role checking | `http://core-service:3000/auth/check-role` |
| `NODE_ENV` | Environment mode | `development` |

### Module Configuration

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  providers: [
    AuthValidatorService,
    TokenExtractorService,
    AuthGuard,
    PermissionGuard,
    RoleGuard
  ],
  exports: [
    AuthValidatorService,
    TokenExtractorService,
    AuthGuard,
    PermissionGuard,
    RoleGuard
  ],
})
export class AuthModule {}
```

## Error Handling

The package throws standard NestJS exceptions:

- `UnauthorizedException` (401) - Invalid or missing token
- `ForbiddenException` (403) - Insufficient permissions/roles
- `BadRequestException` (400) - Missing required headers
- `ServiceUnavailableException` (503) - Auth service unavailable

## Advanced Usage

### Custom Token Extraction

```typescript
@Injectable()
export class CustomTokenExtractorService extends TokenExtractorService {
  extractToken(request: Request): string | undefined {
    // Custom extraction logic
    return request.headers['x-custom-token'] as string;
  }
}
```

### Custom Guard Implementation

```typescript
@Injectable()
export class CustomAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Custom validation logic
    const result = await super.canActivate(context);
    // Additional checks...
    return result;
  }
}
```

### Context-Aware Permissions

```typescript
@Get('workspace/:id/users')
@RequirePermissions(['workspace.user.manage'])
getWorkspaceUsers(@Param('id') workspaceId: string) {
  // Permission check will include workspace context
  return this.userService.getWorkspaceUsers(workspaceId);
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build the package
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support, please open an issue on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.