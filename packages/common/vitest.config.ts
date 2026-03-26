import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@/': path.resolve(currentDir, './src') + '/',
      '@seti/common': path.resolve(currentDir, './src'),
      '@ender-seti/common': path.resolve(currentDir, './src'),
    },
  },
});
