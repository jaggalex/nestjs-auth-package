import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthValidatorService } from './auth-validator.service';
import { TokenExtractorService } from './token-extractor.service';
import { User } from './types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private tokenExtractor: TokenExtractorService,
    private authValidator: AuthValidatorService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from request
    const token = this.tokenExtractor.extractToken(request);

    if (!token) {
      this.logger.warn('Access token not found in request');
      throw new UnauthorizedException('Access denied - No authentication token provided');
    }

    try {
      // Validate token and get user info
      const user: User = await this.authValidator.validateToken(token);

      // Add user info to request
      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        // Bubble up 503 when core-service (auth) is unavailable
        throw error;
      }
      this.logger.error('Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new UnauthorizedException('Access denied - Token verification failed');
    }
  }
}