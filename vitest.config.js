import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,mjs,cjs,ts}'],
    exclude: ['**/node_modules/**', '**/.agents/**', '**/skills/**', 'tests/**/*.spec.*']
  }
});
