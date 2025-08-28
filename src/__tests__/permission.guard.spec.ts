import { BadRequestException, ExecutionContext, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthValidatorService } from '../auth-validator.service';
import { PermissionGuard } from '../permission.guard';

const makeCtx = (headers: any = {}, user: any = { sub: 'u1' }) =>
({
  switchToHttp: () => ({
    getRequest: () => ({ headers, user }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as unknown as ExecutionContext);

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let validator: jest.Mocked<AuthValidatorService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    validator = { checkPermission: jest.fn() } as any;
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new PermissionGuard(reflector as any, validator as any);
  });

  it('400 without x-org-id', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['perm.a']); // permissions
    const ctx = makeCtx({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('403 when permission check returns false', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'permissions' ? ['a', 'b'] : 'all',
    );
    validator.checkPermission.mockResolvedValue(false);
    const ctx = makeCtx({ 'x-org-id': 'org1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('passes when all permissions satisfied', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'permissions' ? ['a', 'b'] : 'all',
    );
    validator.checkPermission.mockResolvedValue(true);
    const ctx = makeCtx({ 'x-org-id': 'org1', 'x-workspace-id': 'w1', 'x-object-id': 'o1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('propagates 503 from validator', async () => {
    reflector.getAllAndOverride.mockImplementation((key: any) =>
      key === 'permissions' ? ['a'] : 'any',
    );
    validator.checkPermission.mockRejectedValue(new ServiceUnavailableException());
    const ctx = makeCtx({ 'x-org-id': 'org1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});