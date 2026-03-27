import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/stores/**', 'src/components/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^react$/,
        replacement: path.resolve(currentDir, './node_modules/react'),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(
          currentDir,
          './node_modules/react/jsx-runtime.js',
        ),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(currentDir, './node_modules/react-dom'),
      },
      {
        find: /^@\/components\/(card|cards|effect|icons|wrapper)\//,
        replacement: `${path.resolve(currentDir, '../cards/src/components')}/$1/`,
      },
      {
        find: '@/lib/utils',
        replacement: path.resolve(currentDir, '../cards/src/lib/utils.ts'),
      },
      {
        find: /^@seti\/cards\/styles\/(.*)$/,
        replacement: `${path.resolve(currentDir, '../cards/src/styles')}/$1`,
      },
      {
        find: /^@ender-seti\/cards\/styles\/(.*)$/,
        replacement: `${path.resolve(currentDir, '../cards/src/styles')}/$1`,
      },
      {
        find: /^@seti\/cards$/,
        replacement: path.resolve(currentDir, '../cards/src/index.ts'),
      },
      {
        find: /^@ender-seti\/cards$/,
        replacement: path.resolve(currentDir, '../cards/src/index.ts'),
      },
      {
        find: '@seti/common',
        replacement: path.resolve(currentDir, '../common/src'),
      },
      {
        find: '@ender-seti/common',
        replacement: path.resolve(currentDir, '../common/src'),
      },
      { find: '@', replacement: path.resolve(currentDir, './src') },
    ],
  },
});
