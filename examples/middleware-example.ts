/**
 * Middleware Example
 *
 * This example shows how to use the auth package with Express middleware
 * instead of decorators.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {
  AuthValidatorService,
  TokenExtractorService,
  User
} from '../src';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication Middleware
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private authValidator: AuthValidatorService,
    private tokenExtractor: TokenExtractorService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.tokenExtractor.extractToken(req);

      if (!token) {
        return res.status(401).json({
          error: 'No authentication token provided'
        });
      }

      const user = await this.authValidator.validateToken(token);
      req.user = user;

      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      });
    }
  }
}

// Permission Middleware Factory
export function createPermissionMiddleware(
  requiredPermissions: string[],
  match: 'any' | 'all' = 'all'
) {
  return class PermissionMiddleware implements NestMiddleware {
    constructor(private authValidator: AuthValidatorService) { }

    async use(req: Request, res: Response, next: NextFunction) {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({
          error: 'x-org-id header is required'
        });
      }

      try {
        const hasPermission = await this.authValidator.checkPermission(
          user,
          requiredPermissions,
          match,
          {
            orgId,
            workspaceId: req.headers['x-workspace-id'] as string,
            objectId: req.headers['x-object-id'] as string,
          }
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions'
          });
        }

        next();
      } catch (error) {
        return res.status(503).json({
          error: 'Authorization service unavailable'
        });
      }
    }
  };
}

// Role Middleware Factory
export function createRoleMiddleware(
  requiredRoles: string[],
  match: 'any' | 'all' = 'all'
) {
  return class RoleMiddleware implements NestMiddleware {
    constructor(private authValidator: AuthValidatorService) { }

    async use(req: Request, res: Response, next: NextFunction) {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({
          error: 'x-org-id header is required'
        });
      }

      try {
        const hasRole = await this.authValidator.checkRole(
          user,
          requiredRoles,
          match,
          {
            orgId,
            workspaceId: req.headers['x-workspace-id'] as string,
            objectId: req.headers['x-object-id'] as string,
          }
        );

        if (!hasRole) {
          return res.status(403).json({
            error: 'Insufficient role permissions'
          });
        }

        next();
      } catch (error) {
        return res.status(503).json({
          error: 'Authorization service unavailable'
        });
      }
    }
  };
}

// Usage example:
/*
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  AuthValidatorService,
  TokenExtractorService,
  AuthMiddleware,
  createPermissionMiddleware,
  createRoleMiddleware
} from '@yagas-cat/nestjs-auth';

@Module({
  imports: [HttpModule],
  providers: [AuthValidatorService, TokenExtractorService],
  exports: [AuthValidatorService, TokenExtractorService],
})
class AuthModule {}

@Module({
  imports: [AuthModule],
  controllers: [YourController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply auth to all routes
    consumer.apply(AuthMiddleware).forRoutes('*');

    // Or apply to specific routes
    consumer
      .apply(createPermissionMiddleware(['admin']))
      .forRoutes({ path: 'admin/*', method: RequestMethod.ALL });

    consumer
      .apply(createRoleMiddleware(['manager']))
      .forRoutes('users/management');
  }
}
*/