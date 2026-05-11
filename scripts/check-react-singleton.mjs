#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const packageDirs = ['packages/web', 'packages/client', 'packages/cards'];
const singletonPackages = ['react', 'react-dom', 'react-i18next', 'i18next'];

const failures = [];

function resolvePackage(packageDir, packageName) {
  const requireFromPackage = createRequire(
    path.join(rootDir, packageDir, 'package.json'),
  );
  const manifestPath = requireFromPackage.resolve(
    `${packageName}/package.json`,
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  return {
    manifestPath: fs.realpathSync(manifestPath),
    packageRoot: fs.realpathSync(path.dirname(manifestPath)),
    version: manifest.version,
  };
}

for (const packageName of singletonPackages) {
  const resolutions = [];

  for (const packageDir of packageDirs) {
    try {
      resolutions.push({
        packageDir,
        ...resolvePackage(packageDir, packageName),
      });
    } catch (error) {
      failures.push(
        `${packageDir} cannot resolve ${packageName}: ${error.message}`,
      );
    }
  }

  if (resolutions.length === 0) continue;

  const versions = new Set(resolutions.map((resolution) => resolution.version));
  const roots = new Set(
    resolutions.map((resolution) => resolution.packageRoot),
  );

  if (versions.size > 1 || roots.size > 1) {
    failures.push(
      [
        `${packageName} resolves to multiple packages:`,
        ...resolutions.map(
          (resolution) =>
            `  ${resolution.packageDir}: ${resolution.version} ${resolution.packageRoot}`,
        ),
      ].join('\n'),
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

console.log(
  `React singleton dependency check passed for ${packageDirs.join(', ')}.`,
);
