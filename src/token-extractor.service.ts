import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TokenExtractorService {
  private readonly logger = new Logger(TokenExtractorService.name);

  /**
   * Extract JWT token from request headers or cookies
   * @param request - HTTP request object
   * @returns JWT token string or undefined if not found
   */
  extractToken(request: Request): string | undefined {
    let accessToken: string | undefined;

    // First check Authorization header (for API clients)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      this.logger.debug('Using access token from Authorization header');
    }
    // Fallback to cookies (for browser clients)
    else if (request.cookies && request.cookies['access_token']) {
      accessToken = request.cookies['access_token'];
      this.logger.debug('Using access token from cookies');
    }

    if (!accessToken) {
      this.logger.warn('Access token not found in request');
    }

    return accessToken;
  }
}