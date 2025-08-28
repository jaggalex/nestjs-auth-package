import { AuthValidatorService } from '../auth-validator.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Helper to create an AxiosResponse-like object for tests
const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} } as InternalAxiosRequestConfig,
});

describe('AuthValidatorService', () => {
  let http: jest.Mocked<HttpService>;
  let svc: AuthValidatorService;

  beforeEach(() => {
    http = { post: jest.fn() } as any;
    svc = new AuthValidatorService(http as any);
    // force production to enable cache behavior by default
    process.env.NODE_ENV = 'production';
  });

  it('introspects token and caches for 30s', async () => {
    const ok = { active: true, sub: 'u1', role: 'r', permissions: ['p1'] };
    http.post.mockReturnValueOnce(of(mockAxiosResponse(ok)));
    const u1 = await svc.validateToken('T1');
    const u2 = await svc.validateToken('T1'); // cached
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(u1.sub).toBe('u1');
    expect(u2.sub).toBe('u1');
  });

  it('throws 401 for inactive token', async () => {
    http.post.mockReturnValueOnce(of(mockAxiosResponse({ active: false } as any)));
    await expect(svc.validateToken('T2')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 503 on core-service/network error', async () => {
    http.post.mockReturnValueOnce(throwError(() => new Error('ECONNREFUSED')));
    await expect(svc.validateToken('T3')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('cache disabled in development', async () => {
    process.env.NODE_ENV = 'development';
    const ok = { active: true, sub: 'u2' } as any;
    http.post.mockReturnValue(of(mockAxiosResponse(ok)));
    await svc.validateToken('TD4');
    await svc.validateToken('TD4');
    expect(http.post).toHaveBeenCalledTimes(2);
  });
});