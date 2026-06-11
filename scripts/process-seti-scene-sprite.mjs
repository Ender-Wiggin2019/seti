#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_SOURCE = path.join(
  REPO_ROOT,
  'packages/client/public/assets/seti/refine/v2/sprite/dc5059d8-0be3-496b-967b-c8e6940f0e38.png',
);
const DEFAULT_OUTPUT_DIR = path.join(
  REPO_ROOT,
  'packages/client/public/assets/seti/sprites',
);
const DEFAULT_PREFIXES = ['terrain', 'objects'];
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const options = parseArgs(process.argv.slice(2));
const manifest = buildManifest(options);

if (!options.dryRun) {
  writeSprites(manifest, options);
}

if (options.json) {
  process.stdout.write(`${JSON.stringify(toPrintableManifest(manifest))}\n`);
} else {
  const action = options.dryRun ? 'Would write' : 'Wrote';
  for (const output of manifest.outputs) {
    process.stdout.write(`${action} ${output.output}\n`);
  }
}

function parseArgs(args) {
  const parsed = {
    source: DEFAULT_SOURCE,
    outputDir: DEFAULT_OUTPUT_DIR,
    prefixes: [...DEFAULT_PREFIXES],
    dryRun: false,
    json: false,
    quality: 90,
    size: 256,
    whiteThreshold: 245,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--source') {
      parsed.source = resolveRepoPath(readArgValue(args, ++index, arg));
    } else if (arg === '--output-dir') {
      parsed.outputDir = resolveRepoPath(readArgValue(args, ++index, arg));
    } else if (arg === '--prefixes') {
      parsed.prefixes = readArgValue(args, ++index, arg)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === '--quality') {
      parsed.quality = readPositiveInteger(args, ++index, arg);
    } else if (arg === '--size') {
      parsed.size = readPositiveInteger(args, ++index, arg);
    } else if (arg === '--white-threshold') {
      parsed.whiteThreshold = readPositiveInteger(args, ++index, arg);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.prefixes.length === 0) {
    throw new Error('--prefixes must include at least one prefix');
  }
  if (parsed.whiteThreshold < 0 || parsed.whiteThreshold > 255) {
    throw new Error('--white-threshold must be between 0 and 255');
  }

  return parsed;
}

function readArgValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function readPositiveInteger(args, index, flag) {
  const value = Number(readArgValue(args, index, flag));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return value;
}

function resolveRepoPath(value) {
  return path.isAbsolute(value) ? value : path.join(REPO_ROOT, value);
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/process-seti-scene-sprite.mjs [options]

Slices a 3x3 SETI scene sprite sheet into white-border-trimmed 256x256 WebP
tiles. Defaults target the refine v2 scene sprite and the existing public
terrain_/objects_ sprite filenames.

Options:
  --source <path>           Source 3x3 PNG sheet.
  --output-dir <path>       Directory for generated WebP tiles.
  --prefixes <list>         Comma-separated filename prefixes.
  --quality <number>        cwebp quality, default 90.
  --size <number>           Output tile size, default 256.
  --white-threshold <0-255> Pixel channel threshold treated as white, default 245.
  --dry-run                 Do not write files.
  --json                    Print JSON manifest.
`);
}

function buildManifest(options) {
  const sourceImage = readPng(options.source);
  if (sourceImage.width % 3 !== 0 || sourceImage.height % 3 !== 0) {
    throw new Error(
      `${options.source} must be evenly divisible into a 3x3 grid`,
    );
  }

  const cell = {
    width: sourceImage.width / 3,
    height: sourceImage.height / 3,
  };
  const crops = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      crops.push({
        row,
        col,
        crop: findContentCrop(sourceImage, row, col, cell, options),
      });
    }
  }

  const outputs = options.prefixes.flatMap((prefix) =>
    crops.map(({ row, col, crop }) => {
      const key = `${prefix}_${formatIndex(row)}_${formatIndex(col)}`;
      return {
        key,
        output: toRepoPath(path.join(options.outputDir, `${key}.webp`)),
        sourceCrop: crop,
        target: { width: options.size, height: options.size },
      };
    }),
  );

  return {
    source: toRepoPath(options.source),
    sourceAbs: options.source,
    outputDirAbs: options.outputDir,
    sourceImage: { width: sourceImage.width, height: sourceImage.height },
    cell,
    outputs,
  };
}

function findContentCrop(image, row, col, cell, options) {
  const originX = col * cell.width;
  const originY = row * cell.height;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = -1;
  let maxY = -1;

  for (let y = originY; y < originY + cell.height; y += 1) {
    for (let x = originX; x < originX + cell.width; x += 1) {
      if (!isWhitePixel(image, x, y, options.whiteThreshold)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error(`Cell ${row},${col} has no non-white pixels`);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function isWhitePixel(image, x, y, whiteThreshold) {
  const offset = (y * image.width + x) * image.channels;
  return (
    image.pixels[offset] >= whiteThreshold &&
    image.pixels[offset + 1] >= whiteThreshold &&
    image.pixels[offset + 2] >= whiteThreshold
  );
}

function formatIndex(value) {
  return String(value).padStart(2, '0');
}

function writeSprites(manifest, options) {
  assertCwebpAvailable();
  fs.mkdirSync(options.outputDir, { recursive: true });

  for (const output of manifest.outputs) {
    const targetPath = path.join(REPO_ROOT, output.output);
    const result = spawnSync(
      'cwebp',
      [
        '-quiet',
        '-q',
        String(options.quality),
        '-m',
        '6',
        '-crop',
        String(output.sourceCrop.x),
        String(output.sourceCrop.y),
        String(output.sourceCrop.width),
        String(output.sourceCrop.height),
        '-resize',
        String(output.target.width),
        String(output.target.height),
        manifest.sourceAbs,
        '-o',
        targetPath,
      ],
      { encoding: 'utf8' },
    );

    if (result.error) {
      throw new Error(`Failed to run cwebp: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(
        `cwebp failed for ${output.output}: ${result.stderr || result.stdout}`,
      );
    }
  }
}

function assertCwebpAvailable() {
  const result = spawnSync('cwebp', ['-version'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(
      'Required cwebp executable was not found on PATH. Install WebP tools before generating SETI scene sprites.',
    );
  }
  if (result.status !== 0) {
    throw new Error(`cwebp is not usable: ${result.stderr || result.stdout}`);
  }
}

function toPrintableManifest(manifest) {
  return {
    source: manifest.source,
    sourceImage: manifest.sourceImage,
    cell: manifest.cell,
    outputs: manifest.outputs,
  };
}

function toRepoPath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function readPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${filePath} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`${filePath} must be an 8-bit RGB or RGBA PNG`);
      }
      if (interlace !== 0) {
        throw new Error(`${filePath} must not be interlaced`);
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * channels);
  let inputOffset = 0;
  let outputOffset = 0;
  let previousRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const row = Buffer.from(
      inflated.subarray(inputOffset, inputOffset + stride),
    );
    inputOffset += stride;

    unfilterRow(row, previousRow, channels, filter);
    row.copy(pixels, outputOffset);
    outputOffset += stride;
    previousRow = row;
  }

  return { width, height, channels, pixels };
}

function unfilterRow(row, previousRow, bytesPerPixel, filter) {
  for (let i = 0; i < row.length; i += 1) {
    const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
    const up = previousRow[i] ?? 0;
    const upLeft = i >= bytesPerPixel ? previousRow[i - bytesPerPixel] : 0;

    if (filter === 1) {
      row[i] = (row[i] + left) & 0xff;
    } else if (filter === 2) {
      row[i] = (row[i] + up) & 0xff;
    } else if (filter === 3) {
      row[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
    } else if (filter === 4) {
      row[i] = (row[i] + paethPredictor(left, up, upLeft)) & 0xff;
    } else if (filter !== 0) {
      throw new Error(`Unsupported PNG filter ${filter}`);
    }
  }
}

function paethPredictor(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}
