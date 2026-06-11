import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

describe('process-seti-scene-sprite script', () => {
  it('trims white sheet borders before slicing the refine v2 scene sprite', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/process-seti-scene-sprite.mjs', '--dry-run', '--json'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );
    const manifest = JSON.parse(output) as {
      source: string;
      sourceImage: { width: number; height: number };
      cell: { width: number; height: number };
      outputs: Array<{
        key: string;
        output: string;
        sourceCrop: { x: number; y: number; width: number; height: number };
        target: { width: number; height: number };
      }>;
    };

    expect(manifest.source).toBe(
      'packages/client/public/assets/seti/refine/v2/sprite/dc5059d8-0be3-496b-967b-c8e6940f0e38.png',
    );
    expect(manifest.sourceImage).toEqual({ width: 1254, height: 1254 });
    expect(manifest.cell).toEqual({ width: 418, height: 418 });
    expect(manifest.outputs).toHaveLength(18);
    expect(manifest.outputs.map((entry) => entry.key)).toEqual([
      'terrain_00_00',
      'terrain_00_01',
      'terrain_00_02',
      'terrain_01_00',
      'terrain_01_01',
      'terrain_01_02',
      'terrain_02_00',
      'terrain_02_01',
      'terrain_02_02',
      'objects_00_00',
      'objects_00_01',
      'objects_00_02',
      'objects_01_00',
      'objects_01_01',
      'objects_01_02',
      'objects_02_00',
      'objects_02_01',
      'objects_02_02',
    ]);

    const firstTile = manifest.outputs.find(
      (entry) => entry.key === 'terrain_00_00',
    );
    expect(firstTile?.sourceCrop).toEqual({
      x: 11,
      y: 12,
      width: 407,
      height: 406,
    });
    expect(firstTile?.target).toEqual({ width: 256, height: 256 });

    for (const entry of manifest.outputs) {
      expect(entry.output).toBe(
        `packages/client/public/assets/seti/sprites/${entry.key}.webp`,
      );
      expect(entry.target).toEqual({ width: 256, height: 256 });
      expect(entry.sourceCrop.width).toBeLessThanOrEqual(418);
      expect(entry.sourceCrop.height).toBeLessThanOrEqual(418);
    }

    const terrainOutputs = manifest.outputs.filter((entry) =>
      entry.key.startsWith('terrain_'),
    );
    for (const terrain of terrainOutputs) {
      const objects = manifest.outputs.find(
        (entry) => entry.key === terrain.key.replace('terrain_', 'objects_'),
      );
      expect(objects?.sourceCrop).toEqual(terrain.sourceCrop);
    }
  });

  it('fails fast with an actionable message when cwebp is missing', () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), 'seti-scene-sprites-'));
    const emptyPath = mkdtempSync(path.join(tmpdir(), 'seti-empty-path-'));

    try {
      const result = spawnSync(
        process.execPath,
        ['scripts/process-seti-scene-sprite.mjs', '--output-dir', outputDir],
        {
          cwd: repoRoot,
          encoding: 'utf8',
          env: { ...process.env, PATH: emptyPath },
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'Required cwebp executable was not found on PATH',
      );
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
      rmSync(emptyPath, { recursive: true, force: true });
    }
  });
});
