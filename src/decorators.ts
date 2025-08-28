import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { PermissionGuard } from './permission.guard';
import { RoleGuard } from './role.guard';

/**
 * Combined auth decorator to ensure token is validated before other checks
 */
export const Auth = () => applyDecorators(UseGuards(AuthGuard));

/**
 * Require one or more permissions with match mode (any|all)
 * Defaults to 'all'
 */
export const RequirePermissions = (permissions: string[] | string, match: 'any' | 'all' = 'all') => {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return applyDecorators(
    SetMetadata('permissions', list),
    SetMetadata('match', match),
    UseGuards(PermissionGuard),
  );
};

/**
 * Require one or more roles with match mode (any|all)
 * Defaults to 'all'
 */
export const RequireRoles = (roles: string[] | string, match: 'any' | 'all' = 'all') => {
  const list = Array.isArray(roles) ? roles : [roles];
  return applyDecorators(
    SetMetadata('roles', list),
    SetMetadata('match', match),
    UseGuards(RoleGuard),
  );
};