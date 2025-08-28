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
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private authValidator: AuthValidatorService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | string>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    const matchMode = this.reflector.getAllAndOverride<'any' | 'all'>('match', [
      context.getHandler(),
      context.getClass(),
    ]) || 'all';

    const permissions: string[] | undefined = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : typeof requiredPermissions === 'string'
        ? [requiredPermissions]
        : undefined;

    if (!permissions || permissions.length === 0) {
      return true; // No permission required
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
      const hasPermission = await this.authValidator.checkPermission(
        user,
        permissions,
        matchMode,
        { orgId, workspaceId, objectId },
      );

      if (!hasPermission) {
        this.logger.warn(`User ${user.sub} lacks required permissions ${permissions.join(', ')} (match=${matchMode}) in org=${orgId}`);
        throw new ForbiddenException('Access denied');
      }

      return true;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        // Bubble up 503 per requirements
        throw error;
      }
      this.logger.error(`Error checking permission for user ${user.sub}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        permissions,
        matchMode,
        orgId,
        workspaceId,
        objectId,
      });
      throw new ForbiddenException('Access denied');
    }
  }
}