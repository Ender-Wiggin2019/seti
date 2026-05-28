#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const TOKEN_DIR = path.join(
  REPO_ROOT,
  'packages/client/public/assets/seti/aliens/anomalies/tokens',
);
const GENERATED_TS = path.join(
  REPO_ROOT,
  'packages/client/src/features/board/anomalyTokenSprite.generated.ts',
);
const SPRITE_PNG = path.join(TOKEN_DIR, 'tokens-sprite.png');
const SPRITE_JSON = path.join(TOKEN_DIR, 'tokens-sprite.json');

const TOKEN_FILES = [
  'blue-data.png',
  'blue-energy.png',
  'pink-credit.png',
  'pink-vp.png',
  'yellow-card.png',
  'yellow-publicity.png',
];

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const jsonOutput = args.has('--json');

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
      if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
        throw new Error(
          `${filePath} must be 8-bit RGBA PNG without interlacing`,
        );
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
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

    unfilterRow(row, previousRow, bytesPerPixel, filter);
    row.copy(pixels, outputOffset);
    outputOffset += stride;
    previousRow = row;
  }

  return { width, height, pixels };
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

function createPng(width, height, pixels) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * (stride + 1);
    const pixelOffset = y * stride;
    raw[rawOffset] = 0;
    pixels.copy(raw, rawOffset + 1, pixelOffset, pixelOffset + stride);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', createIhdr(width, height)),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return chunk;
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildSprite() {
  const images = TOKEN_FILES.map((fileName) => ({
    key: path.basename(fileName, '.png'),
    fileName,
    ...readPng(path.join(TOKEN_DIR, fileName)),
  }));
  const [{ width, height }] = images;

  for (const image of images) {
    if (image.width !== width || image.height !== height) {
      throw new Error(
        `${image.fileName} dimensions do not match ${width}x${height}`,
      );
    }
  }

  const spriteWidth = width * images.length;
  const spriteHeight = height;
  const spritePixels = Buffer.alloc(spriteWidth * spriteHeight * 4);
  const entries = {};

  images.forEach((image, index) => {
    const x = index * width;
    entries[image.key] = { x, y: 0, width, height };
    for (let y = 0; y < height; y += 1) {
      image.pixels.copy(
        spritePixels,
        (y * spriteWidth + x) * 4,
        y * width * 4,
        (y + 1) * width * 4,
      );
    }
  });

  return {
    src: '/assets/seti/aliens/anomalies/tokens/tokens-sprite.png',
    image: { width: spriteWidth, height: spriteHeight },
    entries,
    png: createPng(spriteWidth, spriteHeight, spritePixels),
  };
}

function writeGeneratedTs(manifest) {
  const entrySource = Object.entries(manifest.entries)
    .map(
      ([key, entry]) => `  '${key}': {
    x: ${entry.x},
    y: ${entry.y},
    width: ${entry.width},
    height: ${entry.height},
  }`,
    )
    .join(',\n');
  const source = `// Generated by scripts/build-anomalies-token-sprite.mjs. Do not edit by hand.
export const ANOMALY_TOKEN_SPRITE_SRC =
  '${manifest.src}' as const;

export const ANOMALY_TOKEN_SPRITE_IMAGE = {
  width: ${manifest.image.width},
  height: ${manifest.image.height},
} as const;

export const ANOMALY_TOKEN_SPRITES = {
${entrySource},
} as const;

export type TAnomalyTokenSpriteKey = keyof typeof ANOMALY_TOKEN_SPRITES;
`;
  fs.writeFileSync(GENERATED_TS, source);
}

const manifest = buildSprite();
const printableManifest = {
  src: manifest.src,
  image: manifest.image,
  entries: manifest.entries,
};

if (!dryRun) {
  fs.writeFileSync(SPRITE_PNG, manifest.png);
  fs.writeFileSync(
    `${SPRITE_JSON}`,
    `${JSON.stringify(printableManifest, null, 2)}\n`,
  );
  writeGeneratedTs(printableManifest);
}

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(printableManifest)}\n`);
} else if (!dryRun) {
  process.stdout.write(`Wrote ${path.relative(REPO_ROOT, SPRITE_PNG)}\n`);
  process.stdout.write(`Wrote ${path.relative(REPO_ROOT, SPRITE_JSON)}\n`);
  process.stdout.write(`Wrote ${path.relative(REPO_ROOT, GENERATED_TS)}\n`);
}
