import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthValidatorService } from './auth-validator.service';
import { User } from './types';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private reflector: Reflector,
    private authValidator: AuthValidatorService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | string>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const matchMode = this.reflector.getAllAndOverride<'any' | 'all'>('match', [
      context.getHandler(),
      context.getClass(),
    ]) || 'all';

    const roles: string[] | undefined = Array.isArray(requiredRoles)
      ? requiredRoles
      : typeof requiredRoles === 'string'
        ? [requiredRoles]
        : undefined;

    if (!roles || roles.length === 0) {
      return true; // No role required
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    if (!user || !user.sub) {
      this.logger.error('User not found in request');
      throw new ForbiddenException('Access denied');
    }

    // Extract context from headers
    const orgId = String(request.headers['x-org-id'] || '').trim();
    const workspaceId = request.headers['x-workspace-id'] ? String(request.headers['x-workspace-id']).trim() : undefined;
    const objectId = request.headers['x-object-id'] ? String(request.headers['x-object-id']).trim() : undefined;

    if (!orgId) {
      throw new BadRequestException('Missing x-org-id header');
    }

    try {
      const hasRole = await this.authValidator.checkRole(
        user,
        roles,
        matchMode,
        { orgId, workspaceId, objectId },
      );

      if (!hasRole) {
        this.logger.warn(`User ${user.sub} lacks required roles ${roles.join(', ')} (match=${matchMode}) in org=${orgId}`);
        throw new ForbiddenException('Access denied');
      }

      return true;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        // Bubble up 503 per requirements
        throw error;
      }
      this.logger.error(`Error checking role for user ${user.sub}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        roles,
        matchMode,
        orgId,
        workspaceId,
        objectId,
      });
      throw new ForbiddenException('Access denied');
    }
  }
}