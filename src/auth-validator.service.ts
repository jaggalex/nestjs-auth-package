import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { User } from './types';

// Re-export User type for convenience
export type { User };

// Simple in-memory cache for token introspection results
// Keyed by access token; respects TTL unless NODE_ENV === 'development'
const INTROSPECTION_TTL_MS = 30_000;
const tokenCache = new Map<string, { user: User; expiresAt: number }>();

function isDevEnv(): boolean {
  return (process.env.NODE_ENV || '').toLowerCase() === 'development';
}

@Injectable()
export class AuthValidatorService {
  private readonly logger = new Logger(AuthValidatorService.name);

  constructor(private httpService: HttpService) { }

  /**
   * Validate JWT token and extract user information
   * Caches successful results for 30s (disabled in dev)
   * @param token - JWT token to validate
   * @returns Promise<User> - User information from validated token
   */
  async validateToken(token: string): Promise<User> {
    // Check cache (unless in development)
    if (!isDevEnv()) {
      const cached = tokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.debug('Using cached token introspection result');
        return cached.user;
      }
    }

    try {
      const introspectionUrl = process.env.TOKEN_INTROSPECTION_URL || 'http://core-service:3000/auth/introspect';

      const response = await firstValueFrom(
        this.httpService.post(introspectionUrl, { token }),
      );

      if (!response.data?.active) {
        this.logger.warn('Token is not active');
        throw new UnauthorizedException('Invalid token');
      }

      const user: User = {
        sub: response.data.sub,
        role: response.data.role,
        permissions: response.data.permissions,
        accessToken: token,
      };

      // Store in cache (unless in development)
      if (!isDevEnv()) {
        tokenCache.set(token, { user, expiresAt: Date.now() + INTROSPECTION_TTL_MS });
      }

      return user;
    } catch (error) {
      // If we explicitly threw UnauthorizedException above (inactive token), rethrow as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const axiosErr = error as Partial<AxiosError>;
      const status = axiosErr?.response?.status;
      const message = axiosErr?.message || (error instanceof Error ? error.message : 'Unknown error');

      this.logger.error('Error verifying token', {
        error: message,
        status,
      });

      // Treat network or unknown errors (no status) and 5xx as Service Unavailable
      if (!status || status >= 500) {
        throw new ServiceUnavailableException('Auth service unavailable');
      }

      // Other statuses (e.g., 4xx from core-service) -> Unauthorized
      throw new UnauthorizedException('Access denied - Token verification failed');
    }
  }

  /**
   * Check user permission via core-service with context
   * @param user - User information
   * @param permissions - Required permission(s)
   * @param match - any | all (default: all)
   * @param context - { orgId, workspaceId?, objectId? }
   * @returns Promise<boolean> - Whether user has required permissions per match mode
   */
  async checkPermission(
    user: User,
    permissions: string[],
    match: 'any' | 'all' = 'all',
    context: { orgId: string; workspaceId?: string; objectId?: string; objectType?: string },
  ): Promise<boolean> {
    try {
      const permissionCheckUrl = process.env.PERMISSION_CHECK_URL || 'http://core-service:3000/auth/check-permission';

      const permissionCheckData = {
        userId: user.sub,
        orgId: context.orgId,
        workspaceId: context.workspaceId,
        objectType: context.objectType,
        objectId: context.objectId,
        permissions,
        match,
      };

      const response = await firstValueFrom(
        this.httpService.post(permissionCheckUrl, permissionCheckData, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }),
      );

      return Boolean(response.data?.hasPermission);
    } catch (error) {
      const axiosErr = error as Partial<AxiosError>;
      const status = axiosErr?.response?.status;
      const message = axiosErr?.message || (error instanceof Error ? error.message : 'Unknown error');
      this.logger.error(`Error checking permission for user ${user.sub}`, {
        error: message,
        status,
        permissions,
        match,
        context,
      });
      // Per requirements: if core-service is unavailable -> 503
      if (!status || status >= 500) {
        throw new ServiceUnavailableException('Authorization service unavailable');
      }
      // Other statuses (e.g., 4xx) are interpreted by the guard (will return 403)
      return false;
    }
  }

  /**
   * Check user role via core-service with context
   * @param user - User information
   * @param roles - Required role(s)
   * @param match - any | all (default: all)
   * @param context - { orgId, workspaceId?, objectId? }
   * @returns Promise<boolean> - Whether user has required roles per match mode
   */
  async checkRole(
    user: User,
    roles: string[],
    match: 'any' | 'all' = 'all',
    context: { orgId: string; workspaceId?: string; objectId?: string; objectType?: string },
  ): Promise<boolean> {
    try {
      const roleCheckUrl = process.env.ROLE_CHECK_URL || 'http://core-service:3000/auth/check-role';

      const roleCheckData = {
        userId: user.sub,
        orgId: context.orgId,
        workspaceId: context.workspaceId,
        objectType: context.objectType,
        objectId: context.objectId,
        roles,
        match,
      };

      const response = await firstValueFrom(
        this.httpService.post(roleCheckUrl, roleCheckData, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }),
      );

      return Boolean(response.data?.hasRole);
    } catch (error) {
      const axiosErr = error as Partial<AxiosError>;
      const status = axiosErr?.response?.status;
      const message = axiosErr?.message || (error instanceof Error ? error.message : 'Unknown error');
      this.logger.error(`Error checking role for user ${user.sub}`, {
        error: message,
        status,
        roles,
        match,
        context,
      });
      // Per requirements: if core-service is unavailable -> 503
      if (!status || status >= 500) {
        throw new ServiceUnavailableException('Authorization service unavailable');
      }
      // Other statuses (e.g., 4xx) are interpreted by the guard (will return 403)
      return false;
    }
  }
}