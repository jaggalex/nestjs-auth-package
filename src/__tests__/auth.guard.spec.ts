import { ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { AuthValidatorService } from '../auth-validator.service';
import { AuthGuard } from '../auth.guard';
import { TokenExtractorService } from '../token-extractor.service';

const makeCtx = (headers: any = {}, cookies: any = {}) =>
({
  switchToHttp: () => ({
    getRequest: () => ({ headers, cookies }),
  }),
} as unknown as ExecutionContext);

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let validator: jest.Mocked<AuthValidatorService>;

  beforeEach(() => {
    validator = { validateToken: jest.fn() } as any;
    const extractor = new TokenExtractorService();
    guard = new AuthGuard(extractor, validator as any);
  });

  it('401 when no token', async () => {
    await expect(guard.canActivate(makeCtx())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('propagates 503 from validator', async () => {
    const ctx = makeCtx({ authorization: 'Bearer X' });
    validator.validateToken.mockRejectedValue(new ServiceUnavailableException());
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sets request.user on success', async () => {
    const ctx = makeCtx({ authorization: 'Bearer X' });
    validator.validateToken.mockResolvedValue({ sub: 'u1', accessToken: 'X' } as any);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});