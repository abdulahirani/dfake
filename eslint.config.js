import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'android/**/*', 'scripts/**/*'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'no-debugger': 'off',
      'no-empty': 'off',
      'no-undef': 'off',
      'prefer-const': 'off',
      'no-useless-assignment': 'off',
      '@typescript-eslint/prefer-const': 'off',
    },
  },
);
