import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

const baseRules = {
  ...js.configs.recommended.rules,
  ...tseslint.configs.recommended.rules,
  'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.svelte-kit/**', '.superpowers/**'],
  },
  {
    files: ['**/*.{ts,js,cjs,mjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: baseRules,
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tsParser, extraFileExtensions: ['.svelte'] },
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
    },
    plugins: { '@typescript-eslint': tseslint, svelte: sveltePlugin },
    rules: {
      ...baseRules,
      ...(sveltePlugin.configs?.recommended?.rules ?? {}),
    },
  },
  {
    files: ['tests/**/*.ts', '**/*.test.ts'],
    rules: { 'max-lines': 'off' },
  },
];
