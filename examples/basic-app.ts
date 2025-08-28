/**
 * Basic NestJS Application with Authentication
 *
 * This example demonstrates how to integrate @yagas-cat/nestjs-auth
 * into a basic NestJS application.
 */

import { HttpModule } from '@nestjs/axios';
import { Body, Controller, Get, Module, Post } from '@nestjs/common';
import { Auth, RequirePermissions, RequireRoles, User } from '../src';

// Import all auth components
import {
  AuthGuard,
  AuthValidatorService,
  PermissionGuard,
  RoleGuard,
  TokenExtractorService
} from '../src';

// Auth Module - encapsulates all authentication logic
@Module({
  imports: [HttpModule],
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
class AuthModule { }

// Example Controller demonstrating different auth patterns
@Controller('api')
class ApiController {

  @Get('public')
  getPublicData() {
    return {
      message: 'This endpoint is public - no authentication required',
      data: { items: ['public', 'data'] }
    };
  }

  @Get('authenticated')
  @Auth()
  getAuthenticatedData() {
    return {
      message: 'This endpoint requires a valid JWT token',
      data: { items: ['authenticated', 'data'] }
    };
  }

  @Get('admin-only')
  @RequireRoles('admin')
  getAdminData() {
    return {
      message: 'This endpoint requires admin role',
      data: { items: ['admin', 'only', 'data'] }
    };
  }

  @Get('user-management')
  @RequirePermissions(['user.create', 'user.update'], 'any')
  getUserManagementData() {
    return {
      message: 'This endpoint requires user management permissions',
      data: { items: ['user', 'management', 'data'] }
    };
  }

  @Get('profile')
  @Auth()
  getUserProfile(@User() user: User) {
    return {
      message: 'User profile data',
      user: {
        id: user.sub,
        role: user.role,
        permissions: user.permissions
      }
    };
  }

  @Post('workspace/:workspaceId/items')
  @RequirePermissions(['workspace.item.create'])
  createWorkspaceItem(
    @Body() itemData: any,
    @User() user: User
  ) {
    return {
      message: 'Item created in workspace',
      item: {
        ...itemData,
        createdBy: user.sub,
        workspaceId: 'workspace-123'
      }
    };
  }
}

// Main Application Module
@Module({
  imports: [AuthModule],
  controllers: [ApiController],
})
class AppModule { }

// Example usage documentation
/*
Environment Variables Required:
TOKEN_INTROSPECTION_URL=http://your-core-service:3000/auth/introspect
PERMISSION_CHECK_URL=http://your-core-service:3000/auth/check-permission
ROLE_CHECK_URL=http://your-core-service:3000/auth/check-role

Example API Calls:

1. Public endpoint (no auth needed):
GET /api/public
Response: {"message": "This endpoint is public...", "data": {...}}

2. Authenticated endpoint (JWT required):
GET /api/authenticated
Headers: Authorization: Bearer <jwt-token>
Response: {"message": "This endpoint requires a valid JWT token", "data": {...}}

3. Role-based endpoint:
GET /api/admin-only
Headers:
  Authorization: Bearer <jwt-token>
  x-org-id: <organization-id>
Response: {"message": "This endpoint requires admin role", "data": {...}}

4. Permission-based endpoint:
GET /api/user-management
Headers:
  Authorization: Bearer <jwt-token>
  x-org-id: <organization-id>
Response: {"message": "This endpoint requires user management permissions", "data": {...}}
*/

export { ApiController, AppModule, AuthModule };

