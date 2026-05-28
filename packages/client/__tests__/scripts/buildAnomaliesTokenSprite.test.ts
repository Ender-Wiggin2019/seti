import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

describe('build-anomalies-token-sprite script', () => {
  it('describes every anomaly token in a single horizontal sprite', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/build-anomalies-token-sprite.mjs', '--dry-run', '--json'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );
    const manifest = JSON.parse(output) as {
      image: { width: number; height: number };
      entries: Record<
        string,
        { x: number; y: number; width: number; height: number }
      >;
    };

    expect(manifest.image).toEqual({ width: 1584, height: 159 });
    expect(Object.keys(manifest.entries)).toEqual([
      'blue-data',
      'blue-energy',
      'pink-credit',
      'pink-vp',
      'yellow-card',
      'yellow-publicity',
    ]);
    expect(manifest.entries['pink-credit']).toEqual({
      x: 528,
      y: 0,
      width: 264,
      height: 159,
    });
  });
});
