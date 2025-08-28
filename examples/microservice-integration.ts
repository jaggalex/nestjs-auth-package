/**
 * Microservice Integration Example
 *
 * This example demonstrates how to integrate @yagas-cat/nestjs-auth
 * into a microservice architecture where authentication is handled
 * by a separate auth service.
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import {
  AuthGuard,
  AuthValidatorService,
  PermissionGuard,
  RoleGuard,
  TokenExtractorService
} from '../src';

// Global Auth Module for microservice-wide usage
@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    })
  ],
  providers: [
    AuthValidatorService,
    TokenExtractorService,
    AuthGuard,
    PermissionGuard,
    RoleGuard,
    // Custom provider for service-specific configuration
    {
      provide: 'AUTH_CONFIG',
      useValue: {
        serviceName: 'user-service',
        version: '1.0.0',
      }
    }
  ],
  exports: [
    AuthValidatorService,
    TokenExtractorService,
    AuthGuard,
    PermissionGuard,
    RoleGuard,
    'AUTH_CONFIG'
  ],
})
export class GlobalAuthModule { }

// Service-specific auth module with custom configuration
@Module({
  imports: [GlobalAuthModule],
  providers: [
    // Custom token extractor for service-specific needs
    {
      provide: TokenExtractorService,
      useClass: CustomTokenExtractorService,
    }
  ],
})
export class UserServiceAuthModule { }

// Custom token extractor for specific service needs
export class CustomTokenExtractorService extends TokenExtractorService {
  extractToken(request: any): string | undefined {
    // Try custom header first
    let token = request.headers['x-service-token'];

    if (token) {
      return token;
    }

    // Fall back to standard extraction
    return super.extractToken(request);
  }
}

// Example controller for user service
class UserController {
  constructor(
    private authValidator: AuthValidatorService,
    private config: any
  ) { }

  // Example: Manual token validation in service method
  async validateUserSession(token: string) {
    try {
      const user = await this.authValidator.validateToken(token);

      // Check if user has access to this service
      const hasAccess = await this.authValidator.checkPermission(
        user,
        ['user-service.access'],
        'all',
        {
          orgId: 'org-123', // Could come from service context
        }
      );

      return {
        valid: true,
        user,
        hasAccess,
        service: this.config.serviceName
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Example: Batch permission check
  async checkMultiplePermissions(userToken: string, permissions: string[]) {
    const user = await this.authValidator.validateToken(userToken);

    const results = await Promise.allSettled(
      permissions.map(permission =>
        this.authValidator.checkPermission(
          user,
          [permission],
          'all',
          { orgId: 'org-123' }
        )
      )
    );

    return {
      user: user.sub,
      permissions: permissions.map((perm, index) => ({
        permission: perm,
        granted: results[index].status === 'fulfilled' ? results[index].value : false
      }))
    };
  }
}

// Environment configuration example
/*
# User Service Environment Variables
TOKEN_INTROSPECTION_URL=http://auth-service:3000/auth/introspect
PERMISSION_CHECK_URL=http://auth-service:3000/auth/check-permission
ROLE_CHECK_URL=http://auth-service:3000/auth/check-role

# Service-specific settings
SERVICE_NAME=user-service
SERVICE_VERSION=1.0.0
NODE_ENV=production

# Custom headers
X_SERVICE_TOKEN_HEADER=x-service-token
*/

// Docker Compose example for microservice setup
/*
version: '3.8'
services:
  user-service:
    build: .
    environment:
      - TOKEN_INTROSPECTION_URL=http://auth-service:3000/auth/introspect
      - PERMISSION_CHECK_URL=http://auth-service:3000/auth/check-permission
      - ROLE_CHECK_URL=http://auth-service:3000/auth/check-role
    depends_on:
      - auth-service

  auth-service:
    image: your-org/auth-service:latest
    ports:
      - "3000:3000"

  api-gateway:
    image: your-org/api-gateway:latest
    ports:
      - "8080:8080"
    depends_on:
      - user-service
      - auth-service
*/

// Health check example
/*
GET /health/auth
Response: {
  "status": "healthy",
  "authService": {
    "introspectionUrl": "http://auth-service:3000/auth/introspect",
    "status": "connected"
  },
  "timestamp": "2024-08-27T23:00:00.000Z"
}
*/

// All exports are declared inline with class declarations above
