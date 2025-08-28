# Руководство по миграции на пакет аутентификации

## Обзор

Этот документ содержит пошаговое руководство по миграции с использования локального модуля `shared/src/auth` на новый npm пакет `@yagas-cat/nestjs-auth`.

## Преимущества миграции

- **Централизованное управление**: Единая версия пакета для всех сервисов
- **Автоматические обновления**: Использование npm для управления зависимостями
- **Улучшенное тестирование**: Независимые тесты пакета
- **Документация**: Централизованная документация и примеры
- **Поддержка**: Единая точка поддержки для всех команд

## Предварительные требования

- Node.js 18+
- npm или yarn
- Доступ к GitHub Package Registry организации
- Настроенный `.npmrc` файл (см. GITHUB_SETUP.md)

## Шаг 1: Установка пакета

### 1.1 Добавление пакета в зависимости

```bash
# Для каждого сервиса выполните:
npm install @yagas-cat/nestjs-auth
```

### 1.2 Проверка установки

```bash
# Убедитесь что пакет установлен
npm list @yagas-cat/nestjs-auth
```

## Шаг 2: Обновление импортов

### 2.1 Текущие импорты (ДО)

```typescript
// Примеры текущих импортов в сервисах
import { AuthGuard, RequirePermissions, AuthValidatorService } from '../../../shared/src/auth';
import { User } from '../../../shared/src/auth/types';
```

### 2.2 Новые импорты (ПОСЛЕ)

```typescript
// ES Modules (рекомендуется)
import { AuthGuard, RequirePermissions, AuthValidatorService, User } from '@yagas-cat/nestjs-auth';

// CommonJS (если используется)
const { AuthGuard, RequirePermissions, AuthValidatorService, User } = require('@yagas-cat/nestjs-auth');
```

### 2.3 Поиск всех файлов для обновления

```bash
# Найти все файлы с импортами из shared/src/auth
find . -name "*.ts" -o -name "*.js" | xargs grep -l "shared/src/auth"
```

### 2.4 Список сервисов для обновления

На основе анализа проекта, следующие сервисы используют аутентификацию:

1. **bff-service** - использует `shared/src/auth`
2. **core-service** - имеет собственную реализацию аутентификации
3. **catalog-service** - использует `shared/src/auth`
4. **inventory-service** - использует `shared/src/auth`
5. **order-service** - имеет частичную реализацию

## Шаг 3: Обновление конфигурации сервисов

### 3.1 Обновление app.module.ts

#### ДО:
```typescript
import { AuthValidatorService, TokenExtractorService } from '../../../shared/src/auth';

@Module({
  providers: [
    AuthValidatorService,
    TokenExtractorService,
    // другие провайдеры
  ],
  exports: [
    AuthValidatorService,
    TokenExtractorService,
  ],
})
export class AuthModule {}
```

#### ПОСЛЕ:
```typescript
import { AuthValidatorService, TokenExtractorService } from '@yagas-cat/nestjs-auth';

@Module({
  providers: [
    AuthValidatorService,
    TokenExtractorService,
    // другие провайдеры
  ],
  exports: [
    AuthValidatorService,
    TokenExtractorService,
  ],
})
export class AuthModule {}
```

### 3.2 Обновление контроллеров и сервисов

#### ДО:
```typescript
import { RequirePermissions, Auth } from '../../../shared/src/auth';

@Controller('users')
export class UserController {
  @Auth()
  @RequirePermissions(['users:read'])
  async getUsers() {
    // логика
  }
}
```

#### ПОСЛЕ:
```typescript
import { RequirePermissions, Auth } from '@yagas-cat/nestjs-auth';

@Controller('users')
export class UserController {
  @Auth()
  @RequirePermissions(['users:read'])
  async getUsers() {
    // логика
  }
}
```

## Шаг 4: Обновление зависимостей в package.json

### 4.1 Добавление новой зависимости

```json
{
  "dependencies": {
    "@yagas-cat/nestjs-auth": "^1.0.0",
    // другие зависимости
  }
}
```

### 4.2 Удаление ссылки на shared (опционально)

Если решено полностью удалить shared модуль:

```json
{
  "dependencies": {
    // удалить любые ссылки на локальные shared модули
  }
}
```

## Шаг 5: Тестирование миграции

### 5.1 Запуск тестов

```bash
# В каждом сервисе
npm test
npm run test:cov
```

### 5.2 Проверка функциональности

1. **Аутентификация**: Проверьте что JWT токены валидируются корректно
2. **Авторизация**: Убедитесь что guards работают правильно
3. **Permissions**: Проверьте проверку разрешений
4. **Roles**: Проверьте проверку ролей
5. **Decorators**: Убедитесь что декораторы работают

### 5.3 Ручное тестирование API

```bash
# Пример тестирования с заголовками
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-org-id: YOUR_ORG_ID" \
     http://localhost:3000/protected-endpoint
```

## Шаг 6: Удаление старого кода (опционально)

### 6.1 После успешного тестирования

```bash
# Удаление старых файлов (только после подтверждения работоспособности!)
rm -rf shared/src/auth
```

### 6.2 Обновление ссылок

Если в проекте есть ссылки на удаленные файлы, обновите их:

```bash
# Найти все ссылки на удаленные файлы
find . -name "*.ts" -o -name "*.js" | xargs grep -l "../../../shared"
```

## Шаг 7: Развертывание

### 7.1 Обновление Docker образов

```dockerfile
# Пример обновления Dockerfile
FROM node:18-alpine

# Установка зависимостей
COPY package*.json ./
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 7.2 Обновление docker-compose.yml

```yaml
version: '3.8'
services:
  your-service:
    build: .
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

## Шаг 8: Мониторинг и поддержка

### 8.1 Логирование

Проверьте что логи пакета отображаются корректно:

```typescript
// Логи пакета будут отображаться с префиксом [AuthValidatorService], [PermissionGuard] и т.д.
```

### 8.2 Обработка ошибок

Убедитесь что ошибки обрабатываются правильно:

```typescript
// Примеры ошибок которые должен обрабатывать пакет:
// - 401 Unauthorized (нет токена)
// - 403 Forbidden (недостаточно прав)
// - 503 Service Unavailable (ошибка сервиса аутентификации)
```

### 8.3 Производительность

Мониторьте:
- Время валидации токенов
- Количество запросов к сервису аутентификации
- Ошибки авторизации

## Шаг 9: Откат (если необходимо)

### 9.1 Временный откат

Если возникнут проблемы, можно временно откатиться:

```bash
# Удаление нового пакета
npm uninstall @yagas-cat/nestjs-auth

# Восстановление импортов в shared/src/auth
# (нужно отменить изменения в коде)
```

### 9.2 Полный откат

```bash
# Восстановление из git
git checkout HEAD~1
git reset --hard HEAD~1
```

## План миграции по сервисам

### Фаза 1: Подготовка (Неделя 1)
- [ ] Установка пакета в development окружении
- [ ] Обновление импортов в одном сервисе
- [ ] Полное тестирование

### Фаза 2: Постепенная миграция (Недели 2-3)
- [ ] bff-service (низкий риск)
- [ ] catalog-service (средний риск)
- [ ] inventory-service (высокий риск - много endpoints)
- [ ] order-service (низкий риск)

### Фаза 3: Финализация (Неделя 4)
- [ ] Удаление shared/src/auth
- [ ] Обновление документации
- [ ] Финальное тестирование

## Частые проблемы и решения

### Проблема 1: Ошибка импорта
```
Error: Cannot find module '@yagas-cat/nestjs-auth'
```
**Решение**: Проверьте настройку `.npmrc` и доступ к GitHub Package Registry

### Проблема 2: TypeScript ошибки типов
```
Property 'user' does not exist on type 'Request'
```
**Решение**: Убедитесь что типы определены корректно в пакете

### Проблема 3: Ошибки авторизации
```
Error: Access denied - Token verification failed
```
**Решение**: Проверьте конфигурацию TOKEN_INTROSPECTION_URL

## Контакты и поддержка

- **Команда разработки пакета**: [указать контакты]
- **Документация**: [ссылка на README пакета]
- **Issues**: [ссылка на GitHub Issues]

## Следующие шаги

1. **Назначить ответственных** за миграцию каждого сервиса
2. **Создать план тестирования** для каждого сервиса
3. **Настроить мониторинг** ключевых метрик
4. **Подготовить процедуры отката** для каждого этапа
5. **Запланировать обучение** команды работе с новым пакетом

---

**Важно**: Перед началом миграции убедитесь что:
- Все сервисы работают стабильно с текущей реализацией
- Есть полное покрытие тестами
- Подготовлены процедуры отката
- Команда ознакомлена с планом миграции