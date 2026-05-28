import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const hotspotOverridesPath = path.resolve(
  currentDir,
  'public/hotspot-overrides.json',
);

function hotspotOverridesEditorPlugin() {
  return {
    name: 'hotspot-overrides-editor',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/__debug/hotspot-overrides', (req, res, next) => {
        if (req.method !== 'PUT') {
          next();
          return;
        }

        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as unknown;
            if (
              parsed === null ||
              typeof parsed !== 'object' ||
              Array.isArray(parsed)
            ) {
              res.statusCode = 400;
              res.end('Expected hotspot overrides object');
              return;
            }
            void fs
              .writeFile(
                hotspotOverridesPath,
                `${JSON.stringify(parsed, null, 2)}\n`,
                'utf8',
              )
              .then(() => {
                res.statusCode = 204;
                res.end();
              })
              .catch((error: unknown) => {
                res.statusCode = 500;
                res.end(
                  error instanceof Error ? error.message : 'Write failed',
                );
              });
          } catch {
            res.statusCode = 400;
            res.end('Invalid JSON');
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), hotspotOverridesEditorPlugin()],
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
});
