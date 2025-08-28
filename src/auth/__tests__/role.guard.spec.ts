import { BadRequestException, ExecutionContext, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthValidatorService } from '../auth-validator.service';
import { RoleGuard } from '../role.guard';

const makeCtx = (headers: any = {}, user: any = { sub: 'u1' }) =>
({
  switchToHttp: () => ({
    getRequest: () => ({ headers, user }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as unknown as ExecutionContext);

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let validator: jest.Mocked<AuthValidatorService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    validator = { checkRole: jest.fn() } as any;
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RoleGuard(reflector as any, validator as any);
  });

  it('400 without x-org-id', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['role.admin']); // roles
    const ctx = makeCtx({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('403 when role check returns false', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'roles' ? ['a', 'b'] : 'all',
    );
    validator.checkRole.mockResolvedValue(false);
    const ctx = makeCtx({ 'x-org-id': 'org1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('passes when roles satisfied', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'roles' ? ['a', 'b'] : 'any',
    );
    validator.checkRole.mockResolvedValue(true);
    const ctx = makeCtx({ 'x-org-id': 'org1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('propagates 503 from validator', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'roles' ? ['a'] : 'any',
    );
    validator.checkRole.mockRejectedValue(new ServiceUnavailableException());
    const ctx = makeCtx({ 'x-org-id': 'org1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});