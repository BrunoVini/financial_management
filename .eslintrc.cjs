module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', extraFileExtensions: ['.svelte'] },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, es2022: true, node: true },
  rules: {
    'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' },
      extends: ['plugin:svelte/recommended'],
    },
    { files: ['tests/**/*.ts', '**/*.test.ts'], rules: { 'max-lines': 'off' } },
  ],
};
