import 'reflect-metadata';
import { AuthGuard } from '../auth.guard';
import { Auth, RequirePermissions, RequireRoles } from '../decorators';
import { PermissionGuard } from '../permission.guard';
import { RoleGuard } from '../role.guard';

// Helper to read Nest metadata set by decorators
const getMeta = (key: string, target: any) => (Reflect as any).getMetadata(key, target);

describe('Decorators', () => {
  it('Auth applies AuthGuard', () => {
    class C { }
    Auth()(C);
    const guards = getMeta('__guards__', C) || [];
    expect(guards).toContain(AuthGuard);
  });

  it('RequirePermissions sets metadata and applies PermissionGuard (default match=all)', () => {
    class C { }
    RequirePermissions(['a', 'b'])(C);

    expect(getMeta('permissions', C)).toEqual(['a', 'b']);
    expect(getMeta('match', C)).toBe('all');

    const guards = getMeta('__guards__', C) || [];
    expect(guards).toContain(PermissionGuard);
  });

  it('RequireRoles sets metadata and applies RoleGuard (respects match param)', () => {
    class C { }
    RequireRoles('admin', 'any')(C);

    expect(getMeta('roles', C)).toEqual(['admin']);
    expect(getMeta('match', C)).toBe('any');

    const guards = getMeta('__guards__', C) || [];
    expect(guards).toContain(RoleGuard);
  });
});