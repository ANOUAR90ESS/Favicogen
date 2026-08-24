import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // React 19's compiler-oriented rules flag long-standing patterns all
      // over this codebase. They are worth working through, but as errors
      // they would gate every PR behind a refactor nobody asked for — so they
      // stay visible as warnings instead.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'no-useless-assignment': 'warn',

      // Unused code is dead weight; `_`-prefixed args are intentional.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // `any` disables the type checking this project just gained; warn while
      // the existing 29 uses are worked through.
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'group', 'groupEnd', 'groupCollapsed', 'table'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  // UI strings belong in the locale files, not in component source. This is
  // the guard that stops the 313 inline bilingual ternaries growing back.
  {
    files: ['src/components/**/*.tsx', 'src/utils/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/[\\u0600-\\u06FF]/]",
          message:
            'Arabic UI text belongs in src/i18n/locales/ar.ts — use t() instead of an inline string.',
        },
      ],
    },
  },

  // Locale files and legal text are the one place literal Arabic belongs.
  {
    files: ['src/i18n/**/*.ts', 'src/Legal/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  }
);
