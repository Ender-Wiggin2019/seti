import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(currentDir, './src'),
      '@seti/cards': path.resolve(currentDir, '../cards/src'),
      '@ender-seti/cards': path.resolve(currentDir, '../cards/src'),
      '@seti/common': path.resolve(currentDir, '../common/src'),
      '@ender-seti/common': path.resolve(currentDir, '../common/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
});
