// Тестовый скрипт для проверки CommonJS импорта пакета
const { AuthValidatorService, TokenExtractorService, AuthGuard, PermissionGuard, RoleGuard, Auth, RequirePermissions, RequireRoles } = require('./dist/index.js');

console.log('✅ Успешный CommonJS импорт пакета @yagas-cat/nestjs-auth');
console.log('Доступные компоненты:');

// Services
console.log('- AuthValidatorService:', typeof AuthValidatorService);
console.log('- TokenExtractorService:', typeof TokenExtractorService);

// Guards
console.log('- AuthGuard:', typeof AuthGuard);
console.log('- PermissionGuard:', typeof PermissionGuard);
console.log('- RoleGuard:', typeof RoleGuard);

// Decorators
console.log('- Auth:', typeof Auth);
console.log('- RequirePermissions:', typeof RequirePermissions);
console.log('- RequireRoles:', typeof RequireRoles);

console.log('\n🎉 Все экспортируемые компоненты доступны в CommonJS!');