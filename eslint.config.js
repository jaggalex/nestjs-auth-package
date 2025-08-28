// ───────────────────────────────────────────────────────────────────────────────
// ESLint v9 (flat‑config) – NestJS + TypeScript + Jest
// ───────────────────────────────────────────────────────────────────────────────
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

/* -------------------------------------------------------------------------
   1️⃣  Базовые рекомендации ESLint (применяются ко всем файлам)
   -------------------------------------------------------------------------- */
export default [
  js.configs.recommended,

  /* -----------------------------------------------------------------------
     2️⃣  Прод‑код (все *.ts, кроме тестов)
     ----------------------------------------------------------------------- */
  {
    // Файлы, к которым применяется этот блок
    files: ['src/**/*.ts'],

    // Исключаем из этого блока тесты и директории, которые не нужно линтить
    ignores: [
      'dist/',
      'node_modules/',
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
    ],

    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Обычный tsconfig – это единственный проект, который нужен прод‑коду
        project: './tsconfig.json',
      },
    },

    plugins: { '@typescript-eslint': ts },

    // Правила, которые действуют в прод‑коде
    rules: {
      // ----- TypeScript‑правила -----
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error', // строгий
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',

      // ----- Общие JavaScript‑правила -----
      // `no-undef` будет отключено глобально, потому что мы задаём globals ниже
      'no-undef': 'off',
      'no-unused-vars': 'off', // заменяется правилом выше
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },

  /* -----------------------------------------------------------------------
     3️⃣  Тесты ( *.spec.ts и *.test.ts )
     ----------------------------------------------------------------------- */
  {
    files: ['src/**/*.spec.ts', 'src/**/*.test.ts'],

    /* --------------------------------------------------------------------
       Описание глобальных переменных, которые доступны в тестах.
       В «flat‑config» поле `env` больше не поддерживается,
       вместо него используем `languageOptions.globals`.
       Значения могут быть:
         "readonly" – переменная доступна, но её нельзя переопределять
         "writable" – переменная доступна и её можно переопределять
       Мы объявляем только те глобалы, которые в тестах действительно
       используются (Jest‑глобалы + несколько Node‑глобалов).
       -------------------------------------------------------------------- */
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // В тестах **не указываем** `project`, иначе парсер будет искать
        // tsconfig‑файл, которого у нас нет.
      },

      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        // Node globals, которые часто появляются в тестах
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        // Добавляй любые другие глобалы, если понадобится
      },
    },

    plugins: { '@typescript-eslint': ts },

    // Отключаем правила, которые требуют типовой программы.
    // В тестах нам важнее гибкость, а не строгая типовая проверка.
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // При необходимости можно добавить ещё «тяжёлые» правила:
      // '@typescript-eslint/no-unsafe-assignment': 'off',
      // '@typescript-eslint/no-unsafe-call': 'off',
    },

    // Тоже игнорируем каталоги сборки
    ignores: ['dist/', 'node_modules/'],
  },
];