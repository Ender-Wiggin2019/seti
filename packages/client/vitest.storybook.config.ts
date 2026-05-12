import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

const baseViteConfig = viteConfig as UserConfig;

export default defineConfig({
  plugins: baseViteConfig.plugins,
  resolve: baseViteConfig.resolve,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/storybook.setup.ts'],
    include: ['__tests__/storybook/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
});
