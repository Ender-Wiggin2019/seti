import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const currentDir = process.cwd();
const resolveFromClient = (...segments: string[]) =>
  path.resolve(currentDir, ...segments);

const clientAliases = [
  {
    find: /^react$/,
    replacement: resolveFromClient('./node_modules/react'),
  },
  {
    find: /^react\/jsx-runtime$/,
    replacement: resolveFromClient('./node_modules/react/jsx-runtime.js'),
  },
  {
    find: /^react-dom$/,
    replacement: resolveFromClient('./node_modules/react-dom'),
  },
  {
    find: /^@\/components\/(card|cards|effect|icons|wrapper)\//,
    replacement: `${resolveFromClient('../cards/src/components')}/$1/`,
  },
  {
    find: '@/lib/utils',
    replacement: resolveFromClient('../cards/src/lib/utils.ts'),
  },
  {
    find: /^@seti\/cards\/styles\/(.*)$/,
    replacement: `${resolveFromClient('../cards/src/styles')}/$1`,
  },
  {
    find: /^@ender-seti\/cards\/styles\/(.*)$/,
    replacement: `${resolveFromClient('../cards/src/styles')}/$1`,
  },
  {
    find: /^@seti\/cards$/,
    replacement: resolveFromClient('../cards/src/index.ts'),
  },
  {
    find: /^@ender-seti\/cards$/,
    replacement: resolveFromClient('../cards/src/index.ts'),
  },
  {
    find: '@seti/common',
    replacement: resolveFromClient('../common/src'),
  },
  {
    find: '@ender-seti/common',
    replacement: resolveFromClient('../common/src'),
  },
  { find: '@', replacement: resolveFromClient('./src') },
] as const;

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  staticDirs: ['../public'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: [
        ...clientAliases,
        ...(Array.isArray(config.resolve?.alias) ? config.resolve.alias : []),
      ],
    },
  }),
};

export default config;
